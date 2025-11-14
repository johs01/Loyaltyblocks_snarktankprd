/**
 * Prisma Client Initialization
 *
 * This file sets up a singleton Prisma client instance to prevent
 * multiple instances during development hot-reloading in Next.js
 */

import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * Helper function to check database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Helper function to disconnect from database
 * Useful for cleanup in tests or serverless functions
 */
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect();
}
