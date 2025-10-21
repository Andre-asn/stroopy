import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import client from "./db.js";

export const auth = betterAuth({
  database: mongodbAdapter(client.db("backend")),
  emailAndPassword: { 
    enabled: true, 
  },
  // Ensure cookies work cross-site (Vercel frontend -> Azure backend)
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "none", // required for cross-site cookies
      path: "/",
    },
  },
  trustedOrigins: [
    "https://stroopy.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://www.stroopy.app",
    "https://stroopy.app",
  ],
});