const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { createServer } = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Local imports
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const { configureAuthSecrets } = require("./config/authSecrets");
const configurePassport = require("./config/passport");
const { initMeetingSockets } = require("./sockets/meetingHandler");
const { verifyAccessToken } = require("./utils/tokens");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");
const meetingsRoutes = require("./routes/meetings");
const projectRoutes = require("./routes/projects");
const notificationRoutes = require("./routes/notifications");
const errorHandler = require("./middleware/errorHandler");

// Initialize Express app and HTTP server
const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

// CORS configuration
const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
  ...parseOrigins(process.env.CORS_ORIGIN),
  ...parseOrigins(process.env.FRONTEND_URL),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && origin.startsWith("http://192.168.");
};

const corsOrigin = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`Origin not allowed by CORS: ${origin}`));
};

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(); // Allow unauthenticated guests
  try {
    const payload = verifyAccessToken(token);
    socket.data.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new Error("Invalid socket token"));
  }
});

// Initialize socket handlers
initMeetingSockets(io);

// Core middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
configurePassport();
app.use(passport.initialize());

// Rate limiting middleware
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

// Public routes and health checks
app.get("/", (req, res) => res.send("Backend is running"));
app.get("/api/health", (req, res) => res.json({
  status: "ok",
  service: "intellmeet-api",
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}));

app.get("/metrics", (req, res) => {
  res.type("text/plain").send([
    "# HELP intellmeet_process_uptime_seconds Node process uptime",
    "# TYPE intellmeet_process_uptime_seconds gauge",
    `intellmeet_process_uptime_seconds ${Math.floor(process.uptime())}`,
    "# HELP intellmeet_process_memory_bytes Node heap usage",
    "# TYPE intellmeet_process_memory_bytes gauge",
    `intellmeet_process_memory_bytes ${process.memoryUsage().heapUsed}`,
  ].join("\n"));
});

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/teams", apiLimiter, teamRoutes);
app.use("/api/meetings", apiLimiter, meetingsRoutes);
app.use("/api/projects", apiLimiter, projectRoutes);
app.use("/api/notifications", apiLimiter, notificationRoutes);

// Error handling middleware
app.use(errorHandler);

// Server startup logic
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    configureAuthSecrets();

    // Establish connections to databases
    await connectDB();
    await connectRedis();
    
    // Start the HTTP server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Socket.io is ready");
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
