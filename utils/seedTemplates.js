import mongoose from "mongoose";
import dotenv from "dotenv";
import Template from "../modules/company/template/template.model.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const templates = [
  {
    templateId: "simple",
    title: "Simple",
    description: "Clean, efficient single-page ledger. Perfect for standard consulting and quick estimates.",
    icon: "FileText",
    iconBg: "bg-blue-50",
    pages: 1,
    isVertical: false
  },
  {
    templateId: "dual",
    title: "Dual Page Format",
    description: "A well-designed Front Page for key information, paired with an Invoice Page featuring a manually customizable background.",
    icon: "Compass",
    iconBg: "bg-gray-100",
    pages: 2,
    isVertical: false
  },
  {
    templateId: "threepage",
    title: "3-Page Design",
    description: "Front Page + Invoice Page + Terms & Conditions Page.",
    icon: "Briefcase",
    iconBg: "bg-gray-100",
    pages: 3,
    isVertical: false
  },
  {
    templateId: "fourpage",
    title: "Complete 4-Page Format",
    description: "Front Page + Invoice Page + Terms + Product Information.",
    icon: "Briefcase",
    iconBg: "bg-gray-100",
    pages: 4,
    isVertical: false
  }
];

const seedTemplates = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/quickquote";
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing templates to avoid duplicates
    await Template.deleteMany({});
    console.log("Cleared existing templates.");

    // Insert new templates
    await Template.insertMany(templates);
    console.log("Templates seeded successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding templates:", error);
    process.exit(1);
  }
};

seedTemplates();
