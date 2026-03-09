import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { InitiateMintDto } from './mint.dto';
import { createLogger } from '../../common/logger';

const logger = createLogger('MintService');

@Injectable()
export class MintService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('mint') private readonly mintQueue: Queue,
    ) { }

    /**
     * Initiate a fiat-to-NFT mint order.
     * Creates a PENDING FiatOrder and waits for webhook confirmation before queuing.
     */
    async initiate(dto: any, ip: string) {
        const dao = await this.prisma.dAO.findFirst({
            where: { daoAddress: dto.daoAddress.toLowerCase() },
        });
        if (!dao) throw new BadRequestException(`DAO ${dto.daoAddress} not found`);

        const existing = await this.prisma.fiatOrder.findFirst({
            where: { paymentProviderRef: dto.paymentProviderRef },
        });
        if (existing) throw new ConflictException('Payment reference already exists');

        const order = await this.prisma.fiatOrder.create({
            data: {
                daoId: dao.id,
                userPhone: dto.userPhone,
                userAddress: dto.userAddress,
                status: 'PENDING',
                amountFiat: dto.amountFiat,
                amountCrypto: '0',
                currency: dto.currency,
                paymentProviderRef: dto.paymentProviderRef,
            },
        });

        logger.info({ module: 'MintService', orderId: order.id, daoAddress: dto.daoAddress }, 'Fiat order created');
        return { orderId: order.id, status: order.status };
    }

    /**
     * Called by the webhook handler after payment confirmed.
     * Enforces idempotency via order status check.
     */
    async confirmAndQueue(paymentRef: string, amountCrypto: string): Promise<void> {
        const order = await this.prisma.fiatOrder.findFirst({
            where: { paymentProviderRef: paymentRef },
            include: { dao: true },
        });

        if (!order) {
            logger.warn({ module: 'MintService', paymentRef }, 'No order for payment ref — possible duplicate webhook');
            return;
        }

        if (order.status !== 'PENDING') {
            logger.warn({ module: 'MintService', orderId: order.id, status: order.status }, 'Order already processed — idempotent skip');
            return;
        }

        // Update to CONFIRMED and persist crypto amount
        await this.prisma.fiatOrder.update({
            where: { id: order.id },
            data: { status: 'CONFIRMED', amountCrypto },
        });

        if (!order.dao) return;

        // Queue the actual mint job
        await this.mintQueue.add(
            'execute-mint',
            { orderId: order.id, daoAddress: order.dao.daoAddress, nftAddress: order.dao.nftAddress, amountCrypto },
            {
                attempts: 5,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: true,
            },
        );

        logger.info({ module: 'MintService', orderId: order.id }, 'Mint job queued');
    }
}
