import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

const db = mongoose.connection.db;
const collections = await db.listCollections({ name: "invoices" }).toArray();

if (collections.length === 0) {
  console.log("invoices collection does not exist yet; nothing to migrate");
  await mongoose.disconnect();
  process.exit(0);
}

const invoices = db.collection("invoices");

try {
  await invoices.dropIndex("invoiceNumber_1");
  console.log("Dropped old global invoiceNumber_1 index");
} catch (error) {
  if (error.codeName === "IndexNotFound" || error.code === 27) {
    console.log("Old global invoiceNumber_1 index was not present");
  } else {
    throw error;
  }
}

await invoices.createIndex(
  { createdBy: 1, invoiceNumber: 1 },
  { unique: true, name: "createdBy_1_invoiceNumber_1" }
);
console.log("Ensured per-company unique invoice number index");

await mongoose.disconnect();
console.log("Done");
