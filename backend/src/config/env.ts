import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    RPC_URL: z.string().url(),
    WS_RPC_URL: z.string().min(1),
    CHAIN_ID: z.coerce.number().default(1),
    START_BLOCK: z.coerce.bigint().default(0n),
    PROTOCOL_FEE_MANAGER_ADDRESS: z.string().min(50),
    BAD_DAO_FACTORY_ADDRESS: z.string().min(50),
    RELAYER_ENCRYPTED_KEY: z.string().min(1),
    RELAYER_KEY_PASSPHRASE: z.string().min(1),
    API_SECRET: z.string().min(16),
    PAYMENT_WEBHOOK_SECRET: z.string().min(16),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig;

export function validateEnv(): EnvConfig {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌  Invalid environment configuration:');
        console.error(result.error.format());
        process.exit(1);
    }
    _config = result.data;
    return _config;
}

export function getConfig(): EnvConfig {
    if (!_config) throw new Error('Environment not validated yet');
    return _config;
}
