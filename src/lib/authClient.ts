import { createAuthClient } from "better-auth/react";
import { useState, useEffect } from "react";

const backendURL = import.meta.env.VITE_PROD_SERVER_URL || "http://localhost:3000"

export const authClient = createAuthClient({
  baseURL: backendURL,
  fetchOptions: {
    credentials: "include",
  },
});

// Custom auth functions that use our backend endpoints
export const auth = {
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch(`${backendURL}/api/v1/auth/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: { message: data.error || 'Sign in failed' } };
      }

      const data = await response.json();

      return { data };
    }
  },
  signUp: {
    email: async ({ email, name, password }: { email: string; name: string; password: string }) => {
      const response = await fetch(`${backendURL}/api/v1/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, name, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: { message: data.error || 'Sign up failed' } };
      }

      const data = await response.json();

      return { data };
    }
  },
  signOut: async () => {
    const response = await fetch(`${backendURL}/api/v1/auth/sessions`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json();
      return { error: { message: data.error || 'Sign out failed' } };
    }

    const data = await response.json();

    return { data };
  }
};

// Custom hook for session management
export const useSession = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const response = await fetch(`${backendURL}/api/v1/auth/sessions/current`, {
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        setSession(data.user ? { user: data.user } : null);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return { 
    data: session, 
    isPending: loading, 
    refetch: fetchSession 
  };
};

// Export the original better-auth functions for backward compatibility
export const { signIn, signUp, signOut } = authClient;