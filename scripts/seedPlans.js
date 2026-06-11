import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "../modules/admin/pricing-Setup/plan.model.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

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

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    for (const plan of plans) {
      const result = await Plan.findOneAndUpdate(
        { name: plan.name }, // match by name
        plan,
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`📦 Seeded/Updated plan: ${result.name} — $${result.price}/mo`);
    }

    console.log("\n🎉 Plan seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedPlans();
