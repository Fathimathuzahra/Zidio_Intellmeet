const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
const MEMORY_URI_FILE = path.join(__dirname, "..", ".mongo-memory-uri");

const connectDB = async () => {
  let mongoUri = process.env.MONGO_URI;

  // Demo mode avoids a local MongoDB installation. It is intentionally opt-in
  // because its data is discarded whenever the backend restarts.
  if (process.env.USE_IN_MEMORY_DB === "true") {
    console.log("Starting in-memory MongoDB server for local demo mode...");
    try {
      mongoServer = await MongoMemoryServer.create({ instance: { dbName: "intellmeet" } });
      mongoUri = mongoServer.getUri();
      fs.writeFileSync(MEMORY_URI_FILE, mongoUri, "utf8");
      console.log("In-memory MongoDB started successfully.");
    } catch (error) {
      console.warn(
        "In-memory MongoDB bootstrap failed. Falling back to the configured MONGO_URI instead of exiting:",
        error.message
      );
      if (!mongoUri) {
        mongoUri = "mongodb://127.0.0.1:27017/intellmeet";
      }
    }
  }

  if (!mongoUri) {
    console.error("Could not establish a MongoDB connection URI.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
