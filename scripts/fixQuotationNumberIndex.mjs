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
const collections = await db.listCollections({ name: "quotations" }).toArray();

if (collections.length === 0) {
  console.log("quotations collection does not exist yet; nothing to migrate");
  await mongoose.disconnect();
  process.exit(0);
}

const quotations = db.collection("quotations");

try {
  await quotations.dropIndex("quotationNumber_1");
  console.log("Dropped old global quotationNumber_1 index");
} catch (error) {
  if (error.codeName === "IndexNotFound" || error.code === 27) {
    console.log("Old global quotationNumber_1 index was not present");
  } else {
    throw error;
  }
}

await quotations.createIndex(
  { createdBy: 1, quotationNumber: 1 },
  { unique: true, name: "createdBy_1_quotationNumber_1" }
);
console.log("Ensured per-company unique quotation number index");

await mongoose.disconnect();
console.log("Done");
