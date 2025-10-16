import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI!;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToMongoDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export default client;
export { connectToMongoDB };

process.on('SIGTERM', async () => {
  await client.close();
  console.log('MongoDB connection closed');
});