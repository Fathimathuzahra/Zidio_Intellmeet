require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

const demoUsers = [
  { name: "Demo Admin", email: "admin@intellmeet.demo", password: "DemoAdmin123", role: "admin", bio: "Demo administrator account for IntellMeet review." },
  { name: "Demo Member", email: "member@intellmeet.demo", password: "DemoMember123", role: "member", bio: "Demo team member account for IntellMeet review." },
];

async function seedDemoUsers() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  for (const { password, ...user } of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, password: await bcrypt.hash(password, 10), role: user.role, bio: user.bio },
      create: { ...user, password: await bcrypt.hash(password, 10) },
    });
  }
}

seedDemoUsers()
  .then(async () => { console.log("Demo users are ready."); await prisma.$disconnect(); })
  .catch(async (error) => { console.error("Failed to seed demo users:", error.message); await prisma.$disconnect(); process.exitCode = 1; });
