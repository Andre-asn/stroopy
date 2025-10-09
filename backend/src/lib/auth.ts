import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import client from "./db.js";

export const auth = betterAuth({
  database: mongodbAdapter(client.db()),
  emailAndPassword: { 
    enabled: true, 
  },
  trustedOrigins: [
    "https://stroopy.vercel.app" 
  ],
});