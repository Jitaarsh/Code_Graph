import mongoose from "mongoose";
import Plan from "../modules/admin/pricing-Setup/plan.model.js";

// Export the admin connection object
export let adminDb;

/**
 * connectDB - Establishes connection to MongoDB
 * Uses the MONGO_URI from environment variables
 * Exits process on connection failure to prevent silent errors
 */
const connectDB = async () => {
  // Check if MONGO_URI is defined
  if (!process.env.MONGO_URI) {
    console.error("❌ Error: MONGO_URI is not defined in .env file");
    process.exit(1);
  }

  try {
    // 1. Connect default mongoose connection to quickquote
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected (Main DB: ${mongoose.connection.db.databaseName})`);

    // 2. Connect secondary mongoose connection to admin DB
    const adminURI = process.env.ADMIN_MONGO_URI || "mongodb://127.0.0.1:27017/admin";
    adminDb = mongoose.createConnection(adminURI);

    adminDb.on("connected", () => {
      console.log(`✅ MongoDB Connected (Admin DB)`);
    });

    adminDb.on("error", (err) => {
      console.error(`❌ MongoDB Admin DB Connection Error: ${err.message}`);
    });

    // Auto-seed plans if none exist in the main database
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      console.log("🌱 Database is empty. Seeding default subscription plans...");
      const plans = [
        {
          name: "Starter",
          shortDescription: "Perfect for small firms getting started with digital quotations.",
          currency: "USD",
          billingCycle: "monthly",
          price: 29,
          discountPercent: 0,
          features: [
            "50 Active Quotes",
            "Email Support",
            "2 Quotation Templates",
            "Basic PDF Export",
          ],
          isActive: true,
          sortOrder: 0,
        },
        {
          name: "Professional",
          shortDescription: "The most popular choice for growing architectural firms.",
          currency: "USD",
          billingCycle: "monthly",
          price: 79,
          discountPercent: 0,
          features: [
            "Unlimited Quotes",
            "Priority Support",
            "All Quotation Templates",
            "Advanced PDF Export",
            "Customer Directory",
            "Invoice Management",
          ],
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "Enterprise",
          shortDescription: "Tailored solutions for large organizations with custom needs.",
          currency: "USD",
          billingCycle: "monthly",
          price: 199,
          discountPercent: 0,
          features: [
            "Unlimited Everything",
            "Dedicated Account Manager",
            "Custom Integrations",
            "SLA Support",
            "White-label Exports",
            "Team Collaboration",
          ],
          isActive: true,
          sortOrder: 2,
        },
      ];
      await Plan.insertMany(plans);
      console.log("✅ Default plans seeded successfully!");
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;


