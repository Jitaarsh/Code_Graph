import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const managementData = {
  companyName: "UniCrop Management",
  ownerName: "Management User",
  gstNo: "27BBBBB0000B1Z5",
  website: "",
  address: "UniCrop Management Office, Tech Park",
  country: "India",
  state: "Maharashtra",
  city: "Mumbai",
  pincode: "400001",
  description: "Management account for UniCrop Quick Quote system.",
  phone: "9876543211",
  email: "management@unicrop.com",
  password: "managementpassword123",
  role: "management",
  isActive: true,
};

const seedManagement = async () => {
  try {
    const adminURI = process.env.ADMIN_MONGO_URI || "mongodb://127.0.0.1:27017";
    console.log(`Connecting to Admin DB: ${adminURI}`);
    await mongoose.connect(adminURI);
    console.log("Connected to MongoDB (Admin DB)");

    const existingManagement = await User.findOne({
      email: managementData.email,
    }).select("+password");

    if (existingManagement) {
      console.log("Management user already exists. Updating credentials...");
      Object.assign(existingManagement, managementData);
      await existingManagement.save();
      console.log("Management user updated successfully!");
    } else {
      await User.create(managementData);
      console.log("New management user created successfully!");
    }

    console.log("\n-------------------------------------------");
    console.log("MANAGEMENT CREDENTIALS");
    console.log(`Email: ${managementData.email}`);
    console.log(`Password: ${managementData.password}`);
    console.log(`Role: ${managementData.role}`);
    console.log("-------------------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedManagement();
