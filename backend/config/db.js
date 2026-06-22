const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri || mongoUri.includes("<username>")) {
    console.error("\n❌ MONGO_URI is not configured in backend/.env");
    console.error("👉 Get a free URI at https://cloud.mongodb.com (M0 free tier)");
    console.error("👉 Then set: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/intellmeet\n");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
