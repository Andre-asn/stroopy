import { createAuthClient } from "better-auth/react";

const backendURL = import.meta.env.VITE_PROD_SERVER_URL || "http://localhost:3001"

export const authClient = createAuthClient({
  baseURL: backendURL,
  fetchOptions: {
    credentials: "include",
  },
});

// Export convenience methods
export const { signIn, signUp, signOut, useSession } = authClient;