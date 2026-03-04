import fs from "node:fs";
import path from "node:path";
import type { PrismaConfig } from "prisma";

// Load .env manually since Prisma CLI doesn't auto-load it
function loadEnvUrl(): string {
  const root = path.resolve(__dirname, "..");
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (fs.existsSync(envPath)) {
      const match = fs.readFileSync(envPath, "utf-8").match(/^DATABASE_URL=(.+)$/m);
      if (match) return match[1].trim();
    }
  }
  return process.env.DATABASE_URL!;
}

const url = loadEnvUrl();

export default {
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),
  datasource: { url },
  migrate: {
    async development() {
      return { url };
    },
  },
} as PrismaConfig;
