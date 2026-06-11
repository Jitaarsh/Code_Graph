import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import connectDB from "./config/db.js";
import path from "path";
import http from "http";
// import { initSocket } from "./config/socket.js";

import authRoutes from "./routes/authRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import adminPlanRoutes from "./modules/admin/pricing-Setup/plan.routes.js";
// import companyRoutes from "./modules/admin-dashboard/Companies/company.routes.js";
import customerRoutes from "./modules/company/customers/customer.routes.js";
import productRoutes from "./modules/company/product/product.routes.js";
import quotationRoutes from "./modules/company/quotation/quotation.routes.js";
import invoiceRoutes from "./modules/company/invoice/invoice.routes.js";
import templateRoutes from "./modules/company/template/template.routes.js";
import helpCenterRoutes from "./modules/company/helpCenter/helpCenter.routes.js";
import profileSettingsRoutes from "./modules/company/profileSettings/profileSettings.routes.js";
import termsConditionsRoutes from "./modules/company/terms-conditions/termsConditions.routes.js";
import inquiryRoutes from "./modules/company/inquire/inquiry.routes.js";
import adminTicketRoutes from "./modules/admin/tickets/ticket.routes.js";
import adminCompanyRoutes from "./modules/admin/companies/companies.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import errorHandler from "./middleware/errorHandler.js";

// ── Load environment variables ───────────────────────────────
dotenv.config();

// Pre-flight check for required environment variables
const requiredEnv = ["JWT_SECRET"];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    console.error(`❌ Error: ${env} is not defined in .env file`);
    process.exit(1);
  }
});

// ── Connect to MongoDB ──────────────────────────────────────
connectDB();

// ── Initialize Express app ──────────────────────────────────
const app = express();

// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// ── Global Middleware ────────────────────────────────────────

// Enable CORS for frontend requests - MUST BE BEFORE HELMET AND LIMITER
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Set security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting: protect API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// Parse JSON request bodies
app.use(express.json({ limit: "50mb" }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── API Routes ──────────────────────────────────────────────

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 UniCrop Dashboard API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (register, login, me)
app.use("/api/auth", authRoutes);

// Plan routes (get active plans — public, for registration)
app.use("/api/plans", planRoutes);

// Admin Plan routes (full CRUD — admin protected)
app.use("/api/admin/plans", adminPlanRoutes);

// Admin Company routes
app.use("/api/admin/companies", adminCompanyRoutes);

// Customer routes (company module)
app.use("/api/company/customers", customerRoutes);

// Product routes (company module)
app.use("/api/company/products", productRoutes);

// Quotation routes (company module)
app.use("/api/company/quotation", quotationRoutes);

// Invoice routes (company module)
app.use("/api/company/invoice", invoiceRoutes);

// Template routes (company module)
app.use("/api/company/templates", templateRoutes);

// Help Center routes (company module)
app.use("/api/company/help-center", helpCenterRoutes);

// Profile Settings routes (company module)
app.use("/api/company/profile-settings", profileSettingsRoutes);

// Terms & Conditions routes (company module)
app.use("/api/company/terms-conditions", termsConditionsRoutes);

// Inquiry routes (company module)
app.use("/api/company/inquiries", inquiryRoutes);

// Admin Ticket routes
app.use("/api/admin/tickets", adminTicketRoutes);

// Chat & Real-time Communication routes
app.use("/api/chat", chatRoutes);



// ── Error Handling ──────────────────────────────────────────

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

import { initSocket } from "./config/socket.js";
import chatSocket from "./modules/chat/chat.socket.js";

// ── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
chatSocket(io);

server.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}\n`);
});

export default app;
