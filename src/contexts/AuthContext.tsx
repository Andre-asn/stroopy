import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
	id: string;
	email: string;
	username: string;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, username: string, password: string) => Promise<void>;
	logout: () => void;
	loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// Get backend URL
	const getBackendUrl = () => {
		if (import.meta.env.PROD) {
			return import.meta.env.VITE_PROD_SERVER_URL;
		}
		return import.meta.env.VITE_SERVER_URL;
	};

	// Check for existing token on mount
	useEffect(() => {
		const savedToken = localStorage.getItem('authToken');
		if (savedToken) {
			setToken(savedToken);
			// Verify token is still valid
			fetchUserProfile(savedToken);
		} else {
			setLoading(false);
		}
	}, []);

	const fetchUserProfile = async (authToken: string) => {
		try {
			const response = await fetch(`${getBackendUrl()}/api/auth/profile`, {
				headers: {
					'Authorization': `Bearer ${authToken}`
				}
			});

			if (response.ok) {
				const data = await response.json();
				setUser(data.user);
			} else {
				// Token is invalid, remove it
				localStorage.removeItem('authToken');
				setToken(null);
			}
		} catch (error) {
			console.error('Error fetching user profile:', error);
			localStorage.removeItem('authToken');
			setToken(null);
		} finally {
			setLoading(false);
		}
	};

	const login = async (email: string, password: string) => {
		try {
			const response = await fetch(`${getBackendUrl()}/api/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			const data = await response.json();

			if (response.ok) {
				setToken(data.token);
				setUser(data.user);
				localStorage.setItem('authToken', data.token);
			} else {
				throw new Error(data.error || 'Login failed');
			}
		} catch (error) {
			throw error;
		}
	};

	const register = async (email: string, username: string, password: string) => {
		try {
			const response = await fetch(`${getBackendUrl()}/api/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, username, password })
			});

			const data = await response.json();

			if (response.ok) {
				setToken(data.token);
				setUser(data.user);
				localStorage.setItem('authToken', data.token);
			} else {
				throw new Error(data.error || 'Registration failed');
			}
		} catch (error) {
			throw error;
		}
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem('authToken');
	};

	const value = {
		user,
		token,
		login,
		register,
		logout,
		loading
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};
