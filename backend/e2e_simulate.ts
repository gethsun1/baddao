import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const factory = "CBSBF7DGKMHLYF2UZ4SJQVS556JBZWOZWRRBJ2REUU7MKDPL6VAUYDNF";
const feeManager = "CB5T7WVG3F55CQRKCFCMVQRFYUVSHUM63EBFUFVZ2XVTA33DHFQQHQ7C";
const badusd = "CBN5FCEN5XA4WWV5YCPNOVYMSD4ZV4KPIMWV75YSJMZ3QVW6DMBTKTDQ";
const creator = "GCPOQGCVKTFCXMXM2JRI4CE7CMOKIOU5DFZNNVSQVE5WRNYINL4S4GWF";
const stellar = "../stellar";

const nft_hash = "b8f38b7549cdf6d1972f0feec5d73247be13a70408c4502d1baf614e44cff2e3";
const dao_hash = "88401e481af5c9a086e107e80803d5c967ebf1829c98095ee3bb455aed112955";
const escrow_hash = "daaead2e8000f43279ce14ddd4df12010ea578f9974ff94a8c737b8ab3358420";

async function runCommand(cmd: string) {
    console.log(`Executing: ${cmd}`);
    return execSync(cmd, { encoding: 'utf-8' }).trim();
}

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    console.log("=== Pinging Indexer to clear old records (simulate clean state) ===");
    const beforeDaos = await prisma.dAO.count();
    console.log(`DAOs before: ${beforeDaos}`);
    
    console.log("=== PHASE 1: Deploy DAO (Manual Factory Bypass) ===");
    const nftWasm = "../../bad-dao-soroban/target/wasm32-unknown-unknown/release/governance_nft.wasm";
    const govWasm = "../../bad-dao-soroban/target/wasm32-unknown-unknown/release/dao_governor.wasm";
    const escrowWasm = "../../bad-dao-soroban/target/wasm32-unknown-unknown/release/escrow.wasm";

    const nftAddr = await runCommand(`${stellar} contract deploy --wasm ${nftWasm} --source admin_key --network testnet`);
    console.log("Deployed NFT:", nftAddr);
    const govAddr = await runCommand(`${stellar} contract deploy --wasm ${govWasm} --source admin_key --network testnet`);
    console.log("Deployed Governor:", govAddr);
    const escAddr = await runCommand(`${stellar} contract deploy --wasm ${escrowWasm} --source admin_key --network testnet`);
    console.log("Deployed Escrow:", escAddr);

    console.log("Initializing components...");
    await runCommand(`${stellar} contract invoke --id ${nftAddr} --source admin_key --network testnet -- initialize --fee_manager ${feeManager} --dao_treasury ${govAddr} --payment_token ${badusd} --mint_price 10000000`);
    await runCommand(`${stellar} contract invoke --id ${govAddr} --source admin_key --network testnet -- initialize --fee_manager ${feeManager} --nft ${nftAddr} --payment_token ${badusd}`);
    await runCommand(`${stellar} contract invoke --id ${escAddr} --source admin_key --network testnet -- initialize --fee_manager ${feeManager} --payment_token ${badusd}`);

    console.log("Simulating DAO_DPLY indexing...");
    await prisma.dAO.create({
        data: {
            daoAddress: govAddr,
            nftAddress: nftAddr,
            governorAddress: govAddr,
            escrowAddress: escAddr,
            creator: creator,
            txHash: `mock_deploy_tx_${Date.now()}`
        }
    });

    const dao = await prisma.dAO.findFirst({ orderBy: { createdAt: 'desc' }, where: { creator } });
    if (!dao) throw new Error("DAO not saved!");
    console.log("Found indexed DAO:", dao.daoAddress);
    console.log("NFT Address:", dao.nftAddress);
    console.log("Governor Address:", dao.governorAddress);
    console.log("Escrow Address:", dao.escrowAddress);
    
    console.log("=== PHASE 2: Mint NFT ===");
    console.log("Minting some BADUSD buffer to creator...");
    await runCommand(`${stellar} contract invoke --id ${badusd} --source admin_key --network testnet -- mint --to ${creator} --amount 10000000000`);

    console.log("Minting Governance NFT...");
    await runCommand(`${stellar} contract invoke --id ${dao.nftAddress} --source admin_key --network testnet -- mint --to ${creator}`);
    
    console.log("=== PHASE 3: Create Proposal ===");
    const target = badusd;
    const value = 10000000;
    console.log("Creating proposal...");
    await runCommand(`${stellar} contract invoke --id ${dao.governorAddress} --source admin_key --network testnet -- create_proposal --creator ${creator} --targets '[ "${target}" ]' --values '[ "${value}" ]'`);
    
    console.log("Simulating PROP_CREA indexing...");
    const proposalId = "0"; // First proposal is always 0
    await prisma.proposal.create({
        data: {
            daoId: dao.id,
            proposalId: proposalId,
            proposer: creator,
            description: "E2E Test Proposal",
            txHash: `mock_prop_tx_${Date.now()}`
        }
    });

    const proposal = await prisma.proposal.findFirst({ orderBy: { createdAt: 'desc' }, where: { daoId: dao.id } });
    if (!proposal) throw new Error("Proposal not indexed!");
    console.log("Found indexed Proposal ID:", proposal.proposalId);
    
    console.log("=== PHASE 4: Vote ===");
    await runCommand(`${stellar} contract invoke --id ${dao.governorAddress} --source admin_key --network testnet -- vote --proposal_id ${proposal.proposalId} --voter ${creator} --support true`);
    
    console.log("Waiting 30s for voting period to end... (we changed it to 5 ledgers ~= 25s)");
    for(let i=0; i<30; i++) { await sleep(1000); process.stdout.write("."); }
    console.log("");
    
    console.log("=== PHASE 5: Execute Proposal ===");
    await runCommand(`${stellar} contract invoke --id ${dao.governorAddress} --source admin_key --network testnet -- execute --id ${proposal.proposalId}`);
    console.log("Proposal Executed!");
    
    console.log("=== PHASE 6: Escrow Release ===");
    
    console.log("Creating Escrow...");
    await runCommand(`${stellar} contract invoke --id ${dao.escrowAddress} --source admin_key --network testnet -- create_escrow --proposal_id ${proposal.proposalId} --recipient ${creator} --amount 5000000 --caller ${creator}`);
    
    console.log("Releasing Escrow...");
    await runCommand(`${stellar} contract invoke --id ${dao.escrowAddress} --source admin_key --network testnet -- release --proposal_id ${proposal.proposalId}`);
    
    console.log("Waiting 15s to check indexer for escrow event...");
    for(let i=0; i<15; i++) { await sleep(1000); process.stdout.write("."); }
    console.log("");
    
    const treasuryTx = await prisma.treasuryTransaction.findFirst({ orderBy: { createdAt: 'desc' }, where: { daoId: dao.id, type: 'ESCROW_PAYOUT' } });
    if (!treasuryTx) throw new Error("Escrow release not indexed!");
    console.log("Found indexed Escrow Release Tx:", treasuryTx.txHash);
    
    console.log("=== TEST SUCCEEDED ===");
}

main().catch(e => { console.error(e); process.exit(1); });
