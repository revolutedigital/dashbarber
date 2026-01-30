import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient(): PrismaClient {
  // Use connection pool for PostgreSQL
  const connectionString = process.env.DATABASE_URL

  // During build time, DATABASE_URL may not be available
  // Return a mock client that will be replaced at runtime
  if (!connectionString) {
    console.warn('DATABASE_URL not set - Prisma client will not connect to database')
    // Return client without adapter for build-time
    return new PrismaClient() as PrismaClient
  }

  const pool = globalForPrisma.pool ?? new Pool({ connectionString })
  const adapter = new PrismaPg(pool)

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
