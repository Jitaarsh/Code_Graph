import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection.db;
const collections = await db.listCollections({ name: 'termsconditions' }).toArray();

if (collections.length > 0) {
  try {
    await db.collection('termsconditions').dropIndex('versionId_1');
    console.log('✅ Dropped old versionId_1 index successfully');
  } catch (e) {
    console.log('ℹ️  Index not found or already dropped:', e.message);
  }
} else {
  console.log('ℹ️  Collection does not exist yet — no index to drop');
}

await mongoose.disconnect();
console.log('Done');
process.exit(0);
