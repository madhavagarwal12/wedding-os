import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

// A dedicated pg.Pool (rather than handing PrismaPg a bare connection
// string) lets us tune idle recycling and attach an error listener.
// Without idleTimeoutMillis, pooled clients can outlive a lightweight
// dev/proxy database's own idle-connection cutoff; the next query then
// fails with "Server has closed the connection" instead of the pool
// silently reconnecting. Cached on globalThis so Next.js dev/HMR reuses
// one pool instead of leaking a new one per reload.
const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

pool.on("error", (error) => {
  console.error("Unexpected error on idle Postgres client", error);
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
