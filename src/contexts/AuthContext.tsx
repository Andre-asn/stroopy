import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from '../lib/authClient';

interface AuthContextType {
	session: any;
	isPending: boolean;
	refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const { data: session, isPending, refetch } = useSession();

	return (
		<AuthContext.Provider value={{ session, isPending, refetch }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
