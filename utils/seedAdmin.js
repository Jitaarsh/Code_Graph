import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Seed a super admin user into the database.
 * Run: node utils/seedAdmin.js
 */
const seedAdmin = async () => {
  try {
    const adminURI = process.env.ADMIN_MONGO_URI || "mongodb://127.0.0.1:27017/admin";
    console.log(`Connecting to Admin DB: ${adminURI}`);
    await mongoose.connect(adminURI);

    const existingAdmin = await User.findOne({ role: "superadmin" });

    if (existingAdmin) {
      console.log("\n⚠️  Super Admin already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log("   Password: (use the one you set)\n");
      process.exit(0);
    }

    const admin = await User.create({
      companyName: "UniCrop Admin",
      ownerName: "Super Admin",
      gstNo: "00AAAAA0000A0Z0",
      website: "",
      address: "Admin HQ",
      country: "India",
      state: "Maharashtra",
      city: "Mumbai",
      pincode: "400001",
      description: "Super Admin Account",
      phone: "0000000000",
      email: "admin@unicrop.com",
      password: "Admin@123",
      role: "superadmin",
    });

    console.log("\n✅ Super Admin created successfully!");
    console.log("   ──────────────────────────────");
    console.log(`   Email:    admin@unicrop.com`);
    console.log(`   Password: Admin@123`);
    console.log(`   Role:     ${admin.role}`);
    console.log("   ──────────────────────────────\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
