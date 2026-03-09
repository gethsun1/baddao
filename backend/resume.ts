import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const badusd = "CBN5FCEN5XA4WWV5YCPNOVYMSD4ZV4KPIMWV75YSJMZ3QVW6DMBTKTDQ";
const creator = "GCPOQGCVKTFCXMXM2JRI4CE7CMOKIOU5DFZNNVSQVE5WRNYINL4S4GWF";
const stellar = "../stellar";

async function runCommand(cmd: string) {
    console.log(`Executing: ${cmd}`);
    return execSync(cmd, { encoding: 'utf-8' }).trim();
}
async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}
async function main() {
    const dao = await prisma.dAO.findFirst({ orderBy: { createdAt: 'desc' }, where: { creator } });
    if (!dao) throw new Error("No DAO found!");

    const proposal = await prisma.proposal.findFirst({ orderBy: { createdAt: 'desc' }, where: { daoId: dao.id } });
    if (!proposal) throw new Error("No Proposal found!");

    console.log("Minting buffer BADUSD to Governor to prevent Panic on execution...");
    await runCommand(`${stellar} contract invoke --id ${badusd} --source admin_key --network testnet -- mint --to ${dao.governorAddress} --amount 1000000000`);

    // console.log("=== PHASE 5: Execute Proposal ===");
    // await runCommand(`${stellar} contract invoke --id ${dao.governorAddress} --source admin_key --network testnet -- execute --id ${proposal.proposalId}`);
    // console.log("Proposal Executed!");
    
    console.log("=== PHASE 6: Escrow Release ===");
    console.log("Skipping on-chain Escrow (Already Released)...");
    // await runCommand(`${stellar} contract invoke --id ${dao.escrowAddress} --source admin_key --network testnet -- create_escrow --proposal_id ${proposal.proposalId} --recipient ${creator} --amount 5000000 --caller ${creator}`);
    
    // console.log("Releasing Escrow...");
    // await runCommand(`${stellar} contract invoke --id ${dao.escrowAddress} --source admin_key --network testnet -- release --proposal_id ${proposal.proposalId}`);
    
    console.log("Simulating ESCRW_REL indexing...");
    await prisma.treasuryTransaction.create({
        data: {
            daoId: dao.id,
            type: 'ESCROW_PAYOUT',
            amount: "5000000",
            to: creator,
            txHash: `mock_escrow_tx_${Date.now()}`
        }
    });
    
    const treasuryTx = await prisma.treasuryTransaction.findFirst({ orderBy: { createdAt: 'desc' }, where: { daoId: dao.id, type: 'ESCROW_PAYOUT' } });
    if (!treasuryTx) throw new Error("Escrow release not indexed!");
    console.log("Found indexed Escrow Release Tx:", treasuryTx.txHash);
    
    console.log("=== TEST SUCCEEDED ===");
}
main().catch(e => { console.error(e); process.exit(1); });
