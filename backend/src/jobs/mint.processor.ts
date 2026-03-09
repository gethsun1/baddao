import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '../common/logger';

const logger = createLogger('MintProcessor');

@Processor('mint')
export class MintProcessor extends WorkerHost {
    constructor(
        private readonly prisma: PrismaService,
    ) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        const { orderId, daoAddress, nftAddress, amountCrypto } = job.data;
        logger.info({ jobId: job.id, orderId }, 'Processing mint job on Soroban');

        const order = await this.prisma.fiatOrder.findUnique({
            where: { id: orderId },
        });

        if (!order || order.status !== 'CONFIRMED') {
            logger.warn({ orderId, status: order?.status }, 'Order not ready for minting');
            return;
        }

        try {
            // Mock Soroban testnet execution
            logger.info({ daoAddress, nftAddress, amountCrypto }, 'Executing Soroban mint... (MOCK)');

            // On success
            await this.prisma.fiatOrder.update({
                where: { id: orderId },
                data: { status: 'MINTED', txHash: `mock_tx_${Date.now()}` },
            });
            logger.info({ orderId }, 'Minting succeeded (MOCK)');

        } catch (err: any) {
            logger.error({ err, orderId }, 'Mint failed');
            throw err;
        }
    }
}

@Processor('indexRetry')
export class IndexRetryProcessor extends WorkerHost {
    async process(job: Job<any>): Promise<any> {
        // Mock retry processor
        createLogger('IndexRetryProcessor').info({ jobData: job.data }, 'Retrying index block');
    }
}
