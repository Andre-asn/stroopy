import { createAuthClient } from "better-auth/react";

const backendURL = import.meta.env.VITE_PROD_SERVER_URL || "http://localhost:3001"

export const authClient = createAuthClient({
  baseURL: backendURL,
});

// Export convenience methods
export const { signIn, signUp, signOut, useSession } = authClient;