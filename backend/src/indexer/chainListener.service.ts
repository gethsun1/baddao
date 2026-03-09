import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { rpc, xdr, scValToNative, StrKey } from '@stellar/stellar-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { getConfig } from '../config/env';
import { createLogger } from '../common/logger';

const logger = createLogger('ChainListener');

@Injectable()
export class ChainListenerService implements OnModuleInit, OnModuleDestroy {
    private server: rpc.Server;
    private pollingInterval: NodeJS.Timeout;
    private isPolling = false;

    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('mint') private readonly mintQueue: Queue,
        @InjectQueue('indexRetry') private readonly retryQueue: Queue,
    ) { }

    async onModuleInit(): Promise<void> {
        const cfg = getConfig();
        // Fallback to testnet RPC if not provided
        const rpcUrl = cfg.WS_RPC_URL || 'https://soroban-testnet.stellar.org/';
        this.server = new rpc.Server(rpcUrl);
        await this.resume();
        this.startPolling();
        logger.info({ module: 'ChainListener' }, 'Soroban Indexer started');
    }

    async onModuleDestroy(): Promise<void> {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        logger.info({ module: 'ChainListener' }, 'Soroban Indexer stopped');
    }

    private async resume(): Promise<void> {
        const state = await this.prisma.indexerState.upsert({
            where: { network: 'testnet' },
            update: {},
            create: { network: 'testnet', lastIndexedLedger: 0n },
        });
        logger.info({ module: 'ChainListener', lastIndexedLedger: state.lastIndexedLedger.toString() }, 'Resuming from ledger');
    }

    private async saveLedger(ledger: number): Promise<void> {
        await this.prisma.indexerState.update({
            where: { network: 'testnet' },
            data: { lastIndexedLedger: BigInt(ledger) },
        });
    }

    private startPolling(): void {
        this.pollingInterval = setInterval(async () => {
            if (this.isPolling) return;
            this.isPolling = true;
            try {
                await this.pollEvents();
            } catch (err) {
                logger.error({ err }, 'Error polling events');
            } finally {
                this.isPolling = false;
            }
        }, 5000); // 5 seconds
    }

    private async pollEvents(): Promise<void> {
        const state = await this.prisma.indexerState.findUnique({ where: { network: 'testnet' } });
        let startLedger = state ? Number(state.lastIndexedLedger) : 0;
        
        const latestLedger = await this.server.getLatestLedger();
        if (startLedger === 0) startLedger = latestLedger.sequence - 100;
        if (startLedger >= latestLedger.sequence) return;

        // Soroban limits event polling to small ranges, batching required in production.
        // For MVP, we poll up to the latest sequence.
        logger.debug(`Polling ledgers ${startLedger} to ${latestLedger.sequence}`);

        const response = await this.server.getEvents({
            startLedger,
            limit: 10000,
            filters: [
                {
                    type: "contract",
                    // omit contractIds to listen to all DAO deployments + actions since addresses are dynamic
                }
            ]
        });

        for (const record of response.events) {
            if (record.type !== 'contract') continue;
            await this.processEvent(record);
            await this.saveLedger(record.ledger);
        }

        await this.saveLedger(latestLedger.sequence);
    }

    private async processEvent(record: rpc.Api.EventResponse): Promise<void> {
        try {
            const topic1 = record.topic[0];
            if (!topic1) return;

            // Extract string from symbol
            const nativeTopic = scValToNative(topic1);
            if (typeof nativeTopic !== 'string') return;

            switch (nativeTopic) {
                case 'DAO_DPLY':
                    await this.handleDAODeployed(record);
                    break;
                case 'NFT_MINT':
                    await this.handleNFTMint(record);
                    break;
                case 'PROP_CREA':
                    await this.handleProposalCreated(record);
                    break;
                case 'VOTE_CAST':
                    await this.handleVoteCast(record);
                    break;
                case 'PROP_EXEC':
                    await this.handleProposalExecuted(record);
                    break;
                case 'ESCRW_REL':
                    await this.handleEscrowReleased(record);
                    break;
            }
        } catch (err) {
            logger.error({ err, tx: record.txHash }, 'Failed parsing event');
        }
    }

    /** Extract the transaction source account (= the actual DAO creator) from the signed envelope */
    private async getTxSourceAccount(txHash: string): Promise<string | null> {
        try {
            const tx = await this.server.getTransaction(txHash);
            if (tx.status !== rpc.Api.GetTransactionStatus.SUCCESS) return null;
            // envelopeXdr exists on GetSuccessfulTransactionResponse
            const envelopeXdr = (tx as rpc.Api.GetSuccessfulTransactionResponse).envelopeXdr;
            if (!envelopeXdr) return null;
            const env = envelopeXdr as unknown as xdr.TransactionEnvelope;
            // Supports both v0 and v1 envelope types
            if (env.switch().name === 'envelopeTypeTxV0') {
                return StrKey.encodeEd25519PublicKey(env.v0().tx().sourceAccountEd25519());
            } else {
                const muxed = env.v1().tx().sourceAccount();
                if (muxed.switch().name === 'keyTypeEd25519') {
                    return StrKey.encodeEd25519PublicKey(muxed.ed25519());
                }
            }
        } catch { /* ignore parsing errors */ }
        return null;
    }

    private async handleDAODeployed(record: rpc.Api.EventResponse): Promise<void> {
        // Contract emits: topics=(DAO_DPLY,), data=(dao_id u64, dao_addr, nft_addr, escrow_addr)
        // The dao_addr IS the governor contract (dao_governor). No creator in event.
        const data = scValToNative(record.value);
        // data is an array: [dao_id, dao_address, nft_address, escrow_address]
        const daoId    = data[0]?.toString() ?? '0';
        const daoAddr  = data[1]?.toString();  // governor / dao contract address
        const nftAddr  = data[2]?.toString();
        const escrAddr = data[3]?.toString();

        if (!daoAddr || !nftAddr || !escrAddr) {
            logger.warn({ data }, 'DAO_DPLY event missing addresses, skipping');
            return;
        }

        // Fetch the actual signer/creator from the transaction envelope
        const creator = await this.getTxSourceAccount(record.txHash)
            ?? record.contractId?.toString()
            ?? 'unknown';

        await this.prisma.dAO.upsert({
            where: { txHash: record.txHash },
            update: {},
            create: {
                daoAddress:      daoAddr,
                nftAddress:      nftAddr,
                governorAddress: daoAddr,   // dao_addr is the governor
                escrowAddress:   escrAddr,
                creator:         record.contractId?.toString() ?? 'unknown', // factory contract as fallback
                txHash:          record.txHash,
            },
        });
        logger.info({ dao: daoAddr, daoId }, 'Indexed DAO_DPLY');
    }

    private async handleNFTMint(record: rpc.Api.EventResponse): Promise<void> {
        if (!record.contractId) return;
        const minter = scValToNative(record.topic[1]);
        const data = scValToNative(record.value);
        const daoAddress = record.contractId.toString();

        const dao = await this.prisma.dAO.findFirst({ where: { nftAddress: daoAddress } });
        if (!dao) return;

        await this.prisma.member.upsert({
            where: { daoId_userAddress: { daoId: dao.id, userAddress: minter } },
            update: { nftBalance: { increment: 1 } },
            create: { daoId: dao.id, userAddress: minter, nftBalance: 1 }
        });

        await this.prisma.treasuryTransaction.create({
            data: {
                daoId: dao.id,
                type: 'PROTOCOL_FEE',
                amount: data[1].toString(), // protocol_fee
                from: minter,
                to: 'PROTOCOL',
                txHash: record.txHash
            }
        });
        logger.info({ minter, dao: daoAddress }, 'Indexed NFT_MINT');
    }

    private async handleProposalCreated(record: rpc.Api.EventResponse): Promise<void> {
        if (!record.contractId) return;
        const daoAddress = record.contractId.toString();
        // Contract emits: topics=[PROP_CREA], data=u64 (proposal_id)
        const proposalId = scValToNative(record.value).toString();

        const dao = await this.prisma.dAO.findFirst({ where: { governorAddress: daoAddress } });
        if (!dao) return;

        await this.prisma.proposal.upsert({
            where: { txHash: record.txHash },
            update: {},
            create: {
                daoId: dao.id,
                proposalId: proposalId,
                proposer: dao.creator, // Proposer not in event, use dao creator as fallback
                description: `On-chain Proposal #${proposalId}`,
                txHash: record.txHash,
                deadline: new Date(Date.now() + 86400000)
            }
        });
        logger.info({ proposalId, dao: daoAddress }, 'Indexed PROP_CREA');
    }

    private async handleVoteCast(record: rpc.Api.EventResponse): Promise<void> {
        if (!record.contractId) return;
        // Contract emits: topics=[VOTE_CAST, u64(proposal_id)], data=(voter, support)
        const proposalId = scValToNative(record.topic[1]).toString();
        const daoAddress = record.contractId.toString();
        const data = scValToNative(record.value) as [string, boolean];
        const voter = data[0].toString();
        const support = data[1] as boolean;
        const weight = 1; // Each NFT holder has weight 1

        const dao = await this.prisma.dAO.findFirst({ where: { governorAddress: daoAddress } });
        if (!dao) return;

        const proposal = await this.prisma.proposal.findUnique({ where: { daoId_proposalId: { daoId: dao.id, proposalId } } });
        if (!proposal) return;

        await this.prisma.vote.create({
            data: {
                proposalId: proposal.id,
                voterAddress: voter,
                support,
                weight,
                txHash: record.txHash
            }
        });

        await this.prisma.proposal.update({
            where: { id: proposal.id },
            data: {
                votesFor: support ? { increment: weight } : undefined,
                votesAgainst: !support ? { increment: weight } : undefined,
            }
        });
        logger.info({ proposalId, voter, support }, 'Indexed VOTE_CAST');
    }

    private async handleProposalExecuted(record: rpc.Api.EventResponse): Promise<void> {
        if (!record.contractId) return;
        // Contract emits: topics=[PROP_EXEC], data=u64 (proposal_id)
        const proposalId = scValToNative(record.value).toString();
        const daoAddress = record.contractId.toString();

        const dao = await this.prisma.dAO.findFirst({ where: { governorAddress: daoAddress } });
        if (!dao) return;

        await this.prisma.proposal.updateMany({
            where: { daoId: dao.id, proposalId: proposalId },
            data: { status: 'EXECUTED', executedAt: new Date() }
        });
        logger.info({ proposalId }, 'Indexed PROP_EXEC');
    }

    private async handleEscrowReleased(record: rpc.Api.EventResponse): Promise<void> {
        if (!record.contractId) return;
        const daoAddress = record.contractId.toString();
        // Contract emits: topics=[ESCRW_REL], data=recipient (Address)
        const recipient = scValToNative(record.value).toString();

        const dao = await this.prisma.dAO.findFirst({ where: { escrowAddress: daoAddress } });
        if (!dao) return;

        await this.prisma.treasuryTransaction.create({
            data: {
                daoId: dao.id,
                type: 'ESCROW_PAYOUT',
                amount: '0', // Amount not emitted in event, set to 0
                to: recipient,
                txHash: record.txHash
            }
        });
        logger.info({ recipient, dao: daoAddress }, 'Indexed ESCRW_REL');
    }
}
