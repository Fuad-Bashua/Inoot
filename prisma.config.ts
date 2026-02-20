import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: path.resolve(process.cwd(), "prisma/schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});