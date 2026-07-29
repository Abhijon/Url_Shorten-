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

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(router);

  app.use(errorMiddleware);

  return app;
}
