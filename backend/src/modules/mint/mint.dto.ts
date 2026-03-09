import { z } from 'zod';

export const InitiateMintDto = z.object({
    daoAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid DAO address'),
    userEmail: z.string().email().optional(),
    paymentProviderRef: z.string().min(1),
    amountFiat: z.string().min(1),
    currency: z.string().default('USD'),
});

export type InitiateMintDto = z.infer<typeof InitiateMintDto>;

export const PaymentWebhookDto = z.object({
    event: z.string(),
    id: z.string(),
    data: z.object({
        paymentRef: z.string(),
        amountCrypto: z.string(), // wei string
        daoAddress: z.string(),
    }),
});

export type PaymentWebhookDto = z.infer<typeof PaymentWebhookDto>;
