const prisma = require("./prisma");
async function connectDB() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be configured before starting the API.");
  await prisma.$connect();
  console.log("PostgreSQL connected successfully through Prisma.");
}
module.exports = connectDB;
