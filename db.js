import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not defined in environment variables!");
  process.exit(1);
}

export const client = new MongoClient(uri);

await client.connect();
console.log("Connected to MongoDB database: Mentor-Lagbe");

export const db = client.db("Mentor-Lagbe");

// Database Collections
export const usersCollection = db.collection("user");
export const tuitionsCollection = db.collection("tuitions");
export const applicationsCollection = db.collection("applications");
export const paymentsCollection = db.collection("payments");

//Safely converts an ID string or ObjectId into a MongoDB ObjectId

export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && ObjectId.isValid(id) && id.length === 24) {
    try {
      return new ObjectId(id);
    } catch {
      return null;
    }
  }
  return null;
}
