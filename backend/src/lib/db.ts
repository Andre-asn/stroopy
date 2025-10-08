import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Cosmos DB for MongoDB API configuration
const options = {
  ssl: true,
  retryWrites: false,
  maxIdleTimeMS: 120000,
  appName: 'stroopy-backend',
  directConnection: false,
};

let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    console.log('Creating new MongoDB client connection...');
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

// Connect and export
await client.connect();
console.log('Successfully connected to Azure Cosmos DB');

export const db = client.db();
export default client;