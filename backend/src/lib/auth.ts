import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "./db";
import { username } from "better-auth/plugins"

export const auth = betterAuth({
  plugins: [username()],
  database: mongodbAdapter(db),
  emailAndPassword: { 
    enabled: true, 
  }, 
});