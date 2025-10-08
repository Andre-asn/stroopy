import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PROD_SERVER_URL || "http://localhost:3001",
});

// Export convenience methods
export const { signIn, signUp, signOut, useSession } = authClient;