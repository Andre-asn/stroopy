import React, { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface LeaderboardSubmissionModalProps {
	isOpen: boolean;
	onClose: () => void;
	score: number;
	timeInMilliseconds: number;
	onSuccess?: () => void;
}

const LeaderboardSubmissionModal: React.FC<LeaderboardSubmissionModalProps> = ({
	isOpen,
	onClose,
	score,
	timeInMilliseconds,
	onSuccess
}) => {
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const { user, token } = useAuth();

	// Get backend URL
	const getBackendUrl = () => {
		if (import.meta.env.PROD) {
			return import.meta.env.VITE_PROD_SERVER_URL;
		}
		return import.meta.env.VITE_SERVER_URL;
	};

	const handleSubmitScore = async () => {
		if (!user || !token) {
			setShowAuthModal(true);
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const response = await fetch(`${getBackendUrl()}/api/leaderboard/submit-score`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					score,
					timeInMilliseconds
				})
			});

			const data = await response.json();

		if (response.ok) {
			setSuccess(true);
			setSubmitted(true);
			setTimeout(() => {
				onSuccess?.();
				onClose();
			}, 2000);
		} else {
			// Handle specific error for not beating best time
			if (data.error && data.error.includes('beat your current best time')) {
				setError(`You need to beat your current best time to submit a new score. Your current best: ${data.currentBestTime ? formatTime(data.currentBestTime) : 'unknown'}`);
			} else {
				throw new Error(data.error || 'Failed to submit score');
			}
		}
		} catch (error: any) {
			setError(error.message);
		} finally {
			setSubmitting(false);
		}
	};

	const formatTime = (timeInMilliseconds: number) => {
		const totalSeconds = timeInMilliseconds / 1000;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = Math.floor(totalSeconds % 60);
		const milliseconds = Math.floor((timeInMilliseconds % 1000) / 10);
		return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
	};

	if (!isOpen) return null;

	if (success) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
					<div className="text-center">
						<div className="text-6xl mb-4">🎉</div>
						<h2 className="text-2xl font-bold mb-4">Score Submitted!</h2>
						<p className="text-gray-600">Your score has been added to the leaderboard!</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-2xl font-bold">Submit to Leaderboard</h2>
						<button
							onClick={onClose}
							className="text-gray-500 hover:text-gray-700 text-xl"
						>
							×
						</button>
					</div>

					<div className="mb-6">
						<div className="bg-gray-100 rounded-lg p-4 mb-4">
							<div className="text-center">
								<div className="text-3xl font-bold text-blue-600 mb-2">
									{formatTime(timeInMilliseconds)}
								</div>
								<div className="text-lg text-gray-600">
									Completion Time
								</div>
							</div>
						</div>
					</div>

					{error && (
						<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
							{error}
						</div>
					)}

					{user ? (
						<div className="space-y-4">
							<p className="text-gray-600">
								Submit your score as <strong>{user.username}</strong>?
							</p>
							<div className="flex gap-3">
								<Button
									onClick={handleSubmitScore}
									disabled={submitting || submitted}
									className="flex-1"
								>
									{submitted ? 'Submitted!' : submitting ? 'Submitting...' : 'Submit Score'}
								</Button>
								<Button
									onClick={onClose}
									variant="outline"
									className="flex-1"
									disabled={submitted}
								>
									{submitted ? 'Done' : 'Cancel'}
								</Button>
							</div>
							{submitted && (
								<p className="text-sm text-green-600 text-center">
									✅ Score submitted successfully!
								</p>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<p className="text-gray-600">
								Sign up or sign in to submit your score to the leaderboard!
							</p>
							<div className="flex gap-3">
								<Button
									onClick={() => setShowAuthModal(true)}
									className="flex-1"
								>
									Sign Up / Sign In
								</Button>
								<Button
									onClick={onClose}
									variant="outline"
									className="flex-1"
								>
									Skip
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>

			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				onSuccess={() => {
					setShowAuthModal(false);
					// Automatically try to submit score after successful auth
					setTimeout(() => {
						handleSubmitScore();
					}, 500);
				}}
			/>
		</>
	);
};

export default LeaderboardSubmissionModal;
