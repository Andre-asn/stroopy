import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { login, register } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			if (isLogin) {
				await login(email, password);
			} else {
				if (password !== confirmPassword) {
					throw new Error('Passwords do not match');
				}
				if (password.length < 6) {
					throw new Error('Password must be at least 6 characters');
				}
				await register(email, username, password);
			}
			onSuccess?.();
			onClose();
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setEmail('');
		setUsername('');
		setPassword('');
		setConfirmPassword('');
		setError(null);
	};

	const switchMode = () => {
		setIsLogin(!isLogin);
		resetForm();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold">
						{isLogin ? 'Sign In' : 'Sign Up'}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 text-xl"
					>
						×
					</button>
				</div>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full"
						/>
					</div>

					{!isLogin && (
						<div>
							<Input
								type="text"
								placeholder="Username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								minLength={3}
								maxLength={20}
								className="w-full"
							/>
						</div>
					)}

					<div>
						<Input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							className="w-full"
						/>
					</div>

					{!isLogin && (
						<div>
							<Input
								type="password"
								placeholder="Confirm Password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								className="w-full"
							/>
						</div>
					)}

					<Button
						type="submit"
						disabled={loading}
						className="w-full"
					>
						{loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
					</Button>
				</form>

				<div className="mt-4 text-center">
					<button
						onClick={switchMode}
						className="text-blue-600 hover:text-blue-800"
					>
						{isLogin 
							? "Don't have an account? Sign up" 
							: "Already have an account? Sign in"
						}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AuthModal;
