import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env for the CLI; Node's built-in loader does (no-op on Vercel, where env is injected).
try {
  process.loadEnvFile(".env");
} catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL },
});
