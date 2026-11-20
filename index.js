import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();

    console.log("You successfully connected to MongoDB!");

    return client;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}

const databaseConnect = await connectToMongoDB();

// Database
const db = databaseConnect.db("Mentor-Lagbe");

// Collections
const usersCollection = db.collection("user");
const tuitionsCollection = db.collection("tuitions");
const applicationsCollection = db.collection("applications");
const paymentsCollection = db.collection("payments");

// Root Route
app.get("/", (req, res) => {
  res.json("Server is running...");
});

// Get Users
app.get("/users", async (req, res) => {
  try {
    const users = await usersCollection.find({}).toArray();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
