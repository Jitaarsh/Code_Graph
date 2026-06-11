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
    description: "Clean, one-page minimal design.",
    icon: "FileText",
    iconBg: "bg-blue-50",
    pages: 1,
    isVertical: false,
  },
  {
    templateId: "dual",
    title: "Dual Page",
    description: "Sophisticated two-page layout.",
    icon: "Layers",
    iconBg: "bg-emerald-50",
    pages: 2,
    isVertical: false,
  },
  {
    templateId: "threepage",
    title: "3-Page Design",
    description: "Complete proposal with T&C.",
    icon: "Layout",
    iconBg: "bg-amber-50",
    pages: 3,
    isVertical: false,
  },
  {
    templateId: "fourpage",
    title: "Professional 4-Page",
    description: "High-fidelity detailed format.",
    icon: "ShieldCheck",
    iconBg: "bg-indigo-50",
    pages: 4,
    isVertical: false,
  },
  {
    templateId: "creative",
    title: "Creative Emerald 2-Page",
    description: "Modern, high-contrast creative design.",
    icon: "Briefcase",
    iconBg: "bg-emerald-100",
    pages: 2,
    isVertical: false,
  },
  {
    templateId: "minimalist",
    title: "Minimalist Bold",
    description: "High-contrast monochrome design.",
    icon: "Square",
    iconBg: "bg-slate-100",
    pages: 3,
    isVertical: false,
  },
  {
    templateId: "institutional",
    title: "Institutional Emerald",
    description: "Premium 4-page corporate design.",
    icon: "Briefcase",
    iconBg: "bg-[#EBF0FF]",
    pages: 4,
    isVertical: false,
  },
  {
    templateId: "elegant",
    title: "Elegant Serif",
    description: "Sophisticated single-page quote.",
    icon: "Compass",
    iconBg: "bg-stone-100",
    pages: 1,
    isVertical: false,
  },
];

const seedTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    for (const t of templates) {
      await Template.findOneAndUpdate(
        { templateId: t.templateId },
        t,
        { upsert: true, new: true }
      );
      console.log(`Seeded/Updated template: ${t.title}`);
    }

    console.log("Template seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedTemplates();
