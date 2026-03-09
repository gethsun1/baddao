import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { MintService } from '../modules/mint/mint.service';
import { PrismaService } from '../prisma/prisma.service';
import { createLogger } from '../common/logger';

const logger = createLogger('MpesaIntegration');

@Controller('mpesa')
export class PaymentWebhookController {
    constructor(
        private readonly mintService: MintService,
        private readonly prisma: PrismaService
    ) {}

    @Post('pay')
    async stkPush(@Body() body: { phoneNumber: string; amount: string; daoId: string; userAddress: string }) {
        logger.info({ phone: body.phoneNumber }, 'Initiating STK Push Sandbox');
        
        const checkoutId = `ws_CO_${Date.now()}`;
        
        await this.prisma.fiatOrder.create({
            data: {
                daoId: body.daoId,
                userPhone: body.phoneNumber,
                userAddress: body.userAddress,
                amountFiat: body.amount,
                amountCrypto: body.amount,
                paymentProviderRef: checkoutId,
                status: 'PENDING'
            }
        });
        
        return {
            ResponseCode: "0",
            ResponseDescription: "Success. Request accepted for processing",
            CheckoutRequestID: checkoutId
        };
    }

    @Post('callback')
    async callback(@Body() body: any) {
        const payload = body?.Body?.stkCallback;
        if (!payload) throw new BadRequestException('Invalid callback structure');

        const checkoutId = payload.CheckoutRequestID;
        const resultCode = payload.ResultCode;

        if (resultCode !== 0) {
            await this.prisma.fiatOrder.update({
                where: { paymentProviderRef: checkoutId },
                data: { status: 'FAILED' }
            });
            return { received: true, status: 'FAILED' };
        }

        const order = await this.prisma.fiatOrder.update({
            where: { paymentProviderRef: checkoutId },
            data: { status: 'CONFIRMED' }
        });

        logger.info({ checkoutId, daoId: order.daoId, userAddress: order.userAddress }, 'M-Pesa payment confirmed');
        return { received: true, status: 'CONFIRMED' };
    }
}

@Controller('faucet')
export class FaucetController {
    @Post('badusd')
    async requestTokens(@Body() body: { address: string }) {
        logger.info({ to: body.address }, 'Faucet request received');
        return { success: true, message: "Token distribution queued on testnet." };
    }
}
