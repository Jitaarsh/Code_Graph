import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const adminData = {
  companyName: "UniCrop Admin",
  ownerName: "Super Admin",
  gstNo: "27AAAAA0000A1Z5", // Dummy GST
  address: "UniCrop HQ, Tech Park",
  country: "India",
  state: "Maharashtra",
  city: "Mumbai",
  pincode: "400001",
  description: "Main administrator account for UniCrop Quick Quote system.",
  phone: "9876543210",
  email: "admin@unicrop.com",
  password: "adminpassword123", // Will be hashed by User model pre-save hook
  role: "superadmin",
  subscription: "premium",
  isActive: true,
};

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log("ℹ️ Admin already exists. Updating credentials...");
      // Update existing admin
      Object.assign(existingAdmin, adminData);
      await existingAdmin.save();
      console.log("✅ Admin updated successfully!");
    } else {
      // Create new admin
      await User.create(adminData);
      console.log("✅ New Demo Admin created successfully!");
    }

    console.log("\n-------------------------------------------");
    console.log("🔑 ADMIN CREDENTIALS");
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔒 Password: ${adminData.password}`);
    console.log("-------------------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
