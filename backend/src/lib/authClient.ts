import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    usernameClient(),
  ],
});

// Export convenience methods
export const { signIn, signUp, signOut, useSession } = authClient;