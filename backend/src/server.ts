import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`UkRide API listening on http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.fatal(`Port ${env.PORT} is already in use. Stop the other process or change PORT.`);
  } else {
    logger.fatal({ err: error }, 'Server failed to start');
  }
  process.exit(1);
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Error while closing the server');
      process.exit(1);
    }
    process.exit(0);
  });
  // Do not hang forever if a connection refuses to close.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});
