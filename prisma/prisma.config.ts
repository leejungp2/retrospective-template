import path from "node:path";
import { defineConfig } from "prisma/config";
import { loadEnvFile } from "node:process";

// Load .env.local first, then .env as fallback
try { loadEnvFile(path.resolve(__dirname, "..", ".env.local")); } catch {}
try { loadEnvFile(path.resolve(__dirname, "..", ".env")); } catch {}

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
