import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"

// PrismaNeonHttp sends each query as an independent HTTP request to Neon's
// serverless HTTP endpoint. There is no persistent connection to drop, so
// long-running Claude calls between two DB operations no longer cause
// "Control plane request failed" errors.
function createPrismaClient() {
  // Second arg (HTTPQueryOptions) has all-optional fields — {} is valid.
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {})
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
