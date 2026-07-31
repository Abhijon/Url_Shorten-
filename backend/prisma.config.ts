import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Use process.env (not env()) so `prisma generate` works in CI/Docker
 * without DATABASE_URL. Migrate/deploy still need the real URL at runtime.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
