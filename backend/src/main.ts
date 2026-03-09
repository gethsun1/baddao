import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnv } from './config/env';
import { createLogger } from './common/logger';

// Fail-fast env validation before anything else
const cfg = validateEnv();
const logger = createLogger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,  // required for webhook signature verification
    bufferLogs: true,
  });

  app.setGlobalPrefix('api');
  app.enableCors({ origin: false }); // no CORS — backend is not public-facing directly

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  await app.listen(cfg.PORT);
  logger.info({ module: 'Bootstrap', port: cfg.PORT, env: cfg.NODE_ENV }, 'BAD DAO Backend started');
}

bootstrap().catch((err) => {
  logger.fatal({ module: 'Bootstrap', err }, 'Fatal startup error');
  process.exit(1);
});
