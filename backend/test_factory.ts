import 'dotenv/config';
import { execSync } from 'child_process';

const factory = "CDZHWBXIDBVZW6DKX5I3TEFVAD2YVN7CHK3E4REAYHUQ53IY3URGCBHO";
const feeManager = "CB5T7WVG3F55CQRKCFCMVQRFYUVSHUM63EBFUFVZ2XVTA33DHFQQHQ7C";
const badusd = "CBN5FCEN5XA4WWV5YCPNOVYMSD4ZV4KPIMWV75YSJMZ3QVW6DMBTKTDQ";
const creator = "GCPOQGCVKTFCXMXM2JRI4CE7CMOKIOU5DFZNNVSQVE5WRNYINL4S4GWF";
const stellar = "../stellar";

const nft_hash = "ee764a727fc524bb9c48671f350881e87470483f58582f672702a33f88fb7884";
const dao_hash = "5abbba540218456db6400a43613ee70ef60b2bd0b7e35f372a866c102c3e5d72";
const escrow_hash = "1818c7ced842d6a31a379a80a55212bd567a425eb953eb3c873722c0cadca1cf";

async function main() {
    console.log("=== Testing deploy_dao ===");
    try {
        const cmd = `${stellar} contract invoke --id ${factory} --source admin_key --network testnet --fee 10000000 --instruction-leeway 5000000 -- deploy_dao --creator ${creator} --nft_wasm_hash ${nft_hash} --dao_wasm_hash ${dao_hash} --escrow_wasm_hash ${escrow_hash} --fee_manager ${feeManager} --payment_token ${badusd} --mint_price 10000000`;
        console.log(`Executing: ${cmd}`);
        const out = execSync(cmd, { encoding: 'utf-8' }).trim();
        console.log("Success:", out);
    } catch(e: any) {
        console.error("Failed with output:\n", e.stderr);
    }
}
main().catch(console.error);
