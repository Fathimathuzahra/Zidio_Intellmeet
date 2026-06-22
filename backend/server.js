const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { createServer } = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const { initMeetingSockets } = require("./sockets/meetingHandler");
require("dotenv").config();

const connectDB = require("./config/db");
const configurePassport = require("./config/passport");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");
const meetingsRoutes = require("./routes/meetings");
const projectRoutes = require("./routes/projects");
const notificationRoutes = require("./routes/notifications");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CORS_ORIGIN, 
  "http://localhost:5173", 
  "http://127.0.0.1:5173",
  "http://192.168.1.104:5173",
  "https://intell-meet-nu.vercel.app"
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {

      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://192.168.")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initMeetingSockets(io);

// middleware
app.use(helmet({
  crossOriginResourcePolicy: false, 
}));

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://192.168.")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
configurePassport();
app.use(passport.initialize());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/teams", apiLimiter, teamRoutes);
app.use("/api/meetings", apiLimiter, meetingsRoutes);
app.use("/api/projects", apiLimiter, projectRoutes);
app.use("/api/notifications", apiLimiter, notificationRoutes);

app.use(errorHandler);

// port
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} (Accessible on your local Wi-Fi network)`);
      console.log(`✅ Socket.io fully operational on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
  }
};

startServer();