import express from 'express';
import cors from 'cors';
import { router } from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';

/**
 * Builds and configures the Express application.
 * Separated from server.ts so tests can import the app without listening.
 */
export function createApp() {
  const app = express();

  // Render sits behind Cloudflare + private LBs (10.x). Trust private hops so
  // Express walks X-Forwarded-For past those proxies to the real client.
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(router);

  app.use(errorMiddleware);

  return app;
}
