import { createApp } from './app.js';
import { env } from './config/env.js';
import { redis } from './config/redis.js';
import { prisma } from './config/prisma.js';
import { logger } from './utils/logger.js';

/**
 * Process entry point: connects dependencies and starts the HTTP server.
 */
async function bootstrap(): Promise<void> {
  const app = createApp();

  try {
    await redis.connect();
  } catch (error) {
    logger.warn('Redis is not available yet; continuing without cache', error);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      try {
        await prisma.$disconnect();
        redis.disconnect();
        logger.info('Connections closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

bootstrap().catch((error: unknown) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
