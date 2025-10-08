import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db, default as client } from "./db.js";

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client
  }),
  emailAndPassword: { 
    enabled: true, 
  },
  trustedOrigins: [
    "http://localhost:5173",
    "https://stroopy.vercel.app" 
  ]
});