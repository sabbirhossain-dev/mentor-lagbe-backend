import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/promote-admin.js <user-email>");
  process.exit(1);
}

// Create a new MongoClient
const client = new MongoClient(process.env.MONGODB_URI);

async function promote() {
  try {
    await client.connect();
    const db = client.db("Mentor-Lagbe");
    const usersCollection = db.collection("user");

    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    const result = await usersCollection.updateOne(
      { email },
      { $set: { role: "admin", updatedAt: new Date().toISOString() } },
    );

    if (result.modifiedCount > 0 || user.role === "admin") {
      console.log(`Success! User "${email}" is now an Admin.`);
    } else {
      console.log(`User "${email}" was already an Admin or update failed.`);
    }
  } catch (error) {
    console.error("Failed to promote user:", error);
  } finally {
    await client.close();
  }
}

promote();
