const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const MEMORY_URI_FILE = path.join(__dirname, "..", ".mongo-memory-uri");

const demoUsers = [
  {
    name: "Demo Admin",
    email: "admin@intellmeet.demo",
    password: "DemoAdmin123",
    role: "admin",
    bio: "Demo administrator account for IntellMeet review.",
  },
  {
    name: "Demo Member",
    email: "member@intellmeet.demo",
    password: "DemoMember123",
    role: "member",
    bio: "Demo team member account for IntellMeet review.",
  },
];

async function seedDemoUsers() {
  let mongoUri = process.env.MONGO_URI;

  if (process.env.USE_IN_MEMORY_DB === "true") {
    if (!fs.existsSync(MEMORY_URI_FILE)) {
      throw new Error("Start the backend in in-memory demo mode before seeding; demo data cannot persist across separate in-memory database processes.");
    }
    mongoUri = fs.readFileSync(MEMORY_URI_FILE, "utf8").trim();
  }

  if (!mongoUri || mongoUri.includes("<username>")) {
    throw new Error("MONGO_URI is not configured.");
  }

  await mongoose.connect(mongoUri);

  for (const demoUser of demoUsers) {
    const existing = await User.findOne({ email: demoUser.email }).select("+password");

    if (existing) {
      existing.name = demoUser.name;
      existing.password = demoUser.password;
      existing.role = demoUser.role;
      existing.bio = demoUser.bio;
      await existing.save();
      continue;
    }

    await User.create(demoUser);
  }

  await mongoose.disconnect();
}

seedDemoUsers()
  .then(() => {
    console.log("Demo users are ready.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed demo users:", error.message);
    process.exit(1);
  });
