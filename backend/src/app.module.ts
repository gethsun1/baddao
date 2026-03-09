import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { TerminusModule } from '@nestjs/terminus';

import { PrismaService } from './prisma/prisma.service';

// Config
import { getConfig } from './config/env';

// Modules
import { DaoController } from './modules/dao/dao.controller';
import { DaoService } from './modules/dao/dao.service';
import { RevenueController } from './modules/revenue/revenue.controller';
import { RevenueService } from './modules/revenue/revenue.service';
import { MintService } from './modules/mint/mint.service';

// Webhooks
import { PaymentWebhookController, FaucetController } from './webhooks/payment.webhook';

// Jobs
import { MintProcessor, IndexRetryProcessor } from './jobs/mint.processor';

import { ChainListenerService } from './indexer/chainListener.service';

// Filters
import { GlobalExceptionFilter } from './common/exception.filter';

// Health
import { HealthController } from './health.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,
        limit: 60,
      },
    ]),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: { url: getConfig().REDIS_URL },
      }),
    }),
    BullModule.registerQueue(
      { name: 'mint' },
      { name: 'escrowRelease' },
      { name: 'indexRetry' },
    ),
    TerminusModule,
  ],
  controllers: [
    HealthController,
    DaoController,
    RevenueController,
    PaymentWebhookController,
    FaucetController,
  ],
  providers: [
    PrismaService,
    DaoService,
    RevenueService,
    MintService,
    ChainListenerService,
    MintProcessor,
    IndexRetryProcessor,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule { }
