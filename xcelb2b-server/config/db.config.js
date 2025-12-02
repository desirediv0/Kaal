import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const connectWithRetry = async () => {
  try {
    await prisma.$connect();
    console.log("🚀 Database connected!");
  } catch (err) {
    console.error(
      "Error connecting to the database. Retrying in 3 seconds...",
      err.message
    );
    setTimeout(connectWithRetry, 3000);
  }
};

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

connectWithRetry();
