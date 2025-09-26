import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface LeaderboardEntry {
	rank: number;
	username: string;
	score: number;
	timeInMilliseconds: number;
	date: string;
}

interface LeaderboardProps {
	isOpen: boolean;
	onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Get backend URL
	const getBackendUrl = () => {
		if (import.meta.env.PROD) {
			return import.meta.env.VITE_PROD_SERVER_URL;
		}
		return import.meta.env.VITE_SERVER_URL;
	};

	const fetchLeaderboard = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`${getBackendUrl()}/api/leaderboard/top-scores`);
			const data = await response.json();

			if (response.ok) {
				setLeaderboard(data.leaderboard);
			} else {
				throw new Error(data.error || 'Failed to fetch leaderboard');
			}
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			fetchLeaderboard();
		}
	}, [isOpen]);

	const formatTime = (timeInMilliseconds: number) => {
		const totalSeconds = timeInMilliseconds / 1000;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = Math.floor(totalSeconds % 60);
		const milliseconds = Math.floor((timeInMilliseconds % 1000) / 10);
		return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold">🏆 Leaderboard</h2>
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

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">Loading leaderboard...</div>
					</div>
				) : leaderboard.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8">
						<div className="text-6xl mb-4">📊</div>
						<div className="text-gray-500 text-center">
							<p className="text-lg mb-2">No scores yet!</p>
							<p className="text-sm">Be the first to submit a score to the leaderboard.</p>
						</div>
					</div>
				) : (
					<div className="overflow-y-auto flex-1">
						<div className="space-y-2">
							{leaderboard.map((entry, index) => (
								<div
									key={index}
									className={`flex items-center justify-between p-3 rounded-lg border ${
										entry.rank === 1 
											? 'bg-yellow-100 border-yellow-300' 
											: entry.rank === 2
											? 'bg-gray-100 border-gray-300'
											: entry.rank === 3
											? 'bg-orange-100 border-orange-300'
											: 'bg-gray-50 border-gray-200'
									}`}
								>
									<div className="flex items-center gap-3">
										<div className={`text-2xl font-bold ${
											entry.rank === 1 
												? 'text-yellow-600' 
												: entry.rank === 2
												? 'text-gray-600'
												: entry.rank === 3
												? 'text-orange-600'
												: 'text-gray-500'
										}`}>
											{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
										</div>
										<div>
											<div className="font-semibold text-lg">{entry.username}</div>
											<div className="text-sm text-gray-500">{formatDate(entry.date)}</div>
										</div>
									</div>
									<div className="text-right">
										<div className="font-bold text-lg text-green-600">{entry.score} pts</div>
										<div className="text-sm text-gray-500">{formatTime(entry.timeInMilliseconds)}</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				<div className="mt-4 pt-4 border-t">
					<Button onClick={onClose} className="w-full">
						Close
					</Button>
				</div>
			</div>
		</div>
	);
};

export default Leaderboard;
