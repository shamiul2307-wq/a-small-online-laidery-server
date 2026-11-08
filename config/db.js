 
 
   const dns = require("dns");

// Use Google DNS for MongoDB SRV lookup
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing in backend .env");
}

const client = new MongoClient(uri);

let db;

const connectDB = async () => {
  try {
    await client.connect();

    db = client.db("booknook");

    await db.command({ ping: 1 });

    console.log("MongoDB connected successfully!");

    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database is not connected");
  }

  return db;
};

module.exports = { connectDB, getDB };