import express from 'express';
import { LeaderboardEntry, ILeaderboardEntry } from '../models/LeaderboardEntry';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { redis } from '../config/database';

const router = express.Router();

// Submit score to leaderboard
router.post('/submit-score', authenticateToken, async (req: AuthRequest, res) => {
	try {
		const { score, timeInMilliseconds } = req.body;
		const user = req.user!;

		if (!score || !timeInMilliseconds) {
			return res.status(400).json({ error: 'Score and time are required' });
		}

		if (typeof score !== 'number' || score < 0) {
			return res.status(400).json({ error: 'Invalid score' });
		}

		if (typeof timeInMilliseconds !== 'number' || timeInMilliseconds < 0) {
			return res.status(400).json({ error: 'Invalid time' });
		}

		// Check if user already has a score
		const existingEntry = await LeaderboardEntry.findOne({
			userId: user._id as any,
			gameMode: 'singleplayer'
		});

		if (existingEntry) {
			// Only allow submission if the new time is better (lower)
			if (timeInMilliseconds >= existingEntry.timeInMilliseconds) {
				return res.status(400).json({ 
					error: 'You can only submit a score if you beat your current best time',
					currentBestTime: existingEntry.timeInMilliseconds
				});
			}
			
			// Update existing entry with better score
			existingEntry.score = score;
			existingEntry.timeInMilliseconds = timeInMilliseconds;
			existingEntry.date = new Date();
			await existingEntry.save();

			// Update Redis cache for fast leaderboard queries (with error handling)
			try {
				await updateLeaderboardCache();
			} catch (redisError) {
				console.warn('Could not update Redis cache:', redisError);
			}

			res.status(200).json({
				message: 'Score updated successfully',
				entry: {
					score: existingEntry.score,
					timeInMilliseconds: existingEntry.timeInMilliseconds,
					date: existingEntry.date,
					rank: await getPlayerRank((user._id as any).toString())
				}
			});
		} else {
			// Create new leaderboard entry
			const entry = new LeaderboardEntry({
				userId: user._id as any,
				username: user.username,
				score,
				timeInMilliseconds,
				gameMode: 'singleplayer'
			});

			await entry.save();

			// Update Redis cache for fast leaderboard queries (with error handling)
			try {
				await updateLeaderboardCache();
			} catch (redisError) {
				console.warn('Could not update Redis cache:', redisError);
			}

			res.status(201).json({
				message: 'Score submitted successfully',
				entry: {
					score: entry.score,
					timeInMilliseconds: entry.timeInMilliseconds,
					date: entry.date,
					rank: await getPlayerRank((user._id as any).toString())
				}
			});
		}
	} catch (error) {
		console.error('Submit score error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Get leaderboard
router.get('/top-scores', async (req, res) => {
	try {
		const { limit = 50 } = req.query;
		const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100 entries

		// Try to get from Redis cache first (with error handling)
		let cachedData = null;
		try {
			const cacheKey = `leaderboard:singleplayer:top-${limitNum}`;
			cachedData = await redis.get(cacheKey);
		} catch (redisError) {
			console.warn('Redis cache unavailable, using database only:', redisError);
		}

		if (cachedData) {
			return res.json({
				leaderboard: JSON.parse(cachedData),
				cached: true
			});
		}

		// If not in cache, get from database
		const leaderboard = await LeaderboardEntry.find({ gameMode: 'singleplayer' })
			.sort({ score: -1 }) // Highest score first
			.limit(limitNum)
			.select('username score timeInMilliseconds date')
			.lean();

		// Add rank to each entry
		const leaderboardWithRanks = leaderboard.map((entry, index) => ({
			...entry,
			rank: index + 1
		}));

		// Try to cache for 5 minutes (with error handling)
		try {
			const cacheKey = `leaderboard:singleplayer:top-${limitNum}`;
			await redis.setex(cacheKey, 300, JSON.stringify(leaderboardWithRanks));
		} catch (redisError) {
			console.warn('Could not cache leaderboard data:', redisError);
		}

		res.json({
			leaderboard: leaderboardWithRanks,
			cached: false
		});
	} catch (error) {
		console.error('Get leaderboard error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Clean up duplicate entries (keep only best score per user)
router.post('/cleanup-duplicates', async (req, res) => {
	try {
		console.log('Starting cleanup of duplicate leaderboard entries...');
		
		// Get all entries grouped by userId
		const entries = await LeaderboardEntry.find({ gameMode: 'singleplayer' }).lean();
		const userEntries = new Map();
		
		// Group entries by userId
		entries.forEach(entry => {
			const userId = entry.userId.toString();
			if (!userEntries.has(userId)) {
				userEntries.set(userId, []);
			}
			userEntries.get(userId).push(entry);
		});
		
		let deletedCount = 0;
		
		// For each user, keep only their best (lowest time) entry
		for (const [userId, userEntryList] of userEntries) {
			if (userEntryList.length > 1) {
				// Sort by time (lowest first)
				userEntryList.sort((a: ILeaderboardEntry, b: ILeaderboardEntry) => a.timeInMilliseconds - b.timeInMilliseconds);
				
				// Keep the best entry, delete the rest
				const bestEntry = userEntryList[0];
				const entriesToDelete = userEntryList.slice(1);
				
				for (const entryToDelete of entriesToDelete) {
					await LeaderboardEntry.deleteOne({ _id: entryToDelete._id });
					deletedCount++;
				}
				
				console.log(`User ${bestEntry.username}: kept best time ${bestEntry.timeInMilliseconds}ms, deleted ${entriesToDelete.length} duplicates`);
			}
		}
		
		// Clear Redis cache to force refresh
		try {
			await redis.del('leaderboard:singleplayer:top-50');
			console.log('Cleared Redis cache');
		} catch (redisError) {
			console.warn('Could not clear Redis cache:', redisError);
		}
		
		console.log(`Cleanup complete: deleted ${deletedCount} duplicate entries`);
		
		res.json({
			message: 'Cleanup completed successfully',
			deletedCount,
			remainingUsers: userEntries.size
		});
	} catch (error) {
		console.error('Cleanup error:', error);
		res.status(500).json({ error: 'Internal server error during cleanup' });
	}
});

// Get user's best score and rank
router.get('/my-stats', authenticateToken, async (req: AuthRequest, res) => {
	try {
		const user = req.user!;

		// Get user's best score
		const bestScore = await LeaderboardEntry.findOne({ userId: user._id as any })
			.sort({ score: -1 })
			.select('score timeInMilliseconds date')
			.lean();

		// Get user's rank
		const rank = await getPlayerRank((user._id as any).toString());

		// Get user's total games played
		const totalGames = await LeaderboardEntry.countDocuments({ userId: user._id as any });

		res.json({
			bestScore: bestScore || null,
			rank: rank || null,
			totalGames
		});
	} catch (error) {
		console.error('Get user stats error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Helper function to get player rank
async function getPlayerRank(userId: string): Promise<number | null> {
	try {
		const userBestScore = await LeaderboardEntry.findOne({ userId })
			.sort({ score: -1 })
			.select('score')
			.lean();

		if (!userBestScore) return null;

		// Count how many players have better scores
		const betterScores = await LeaderboardEntry.countDocuments({
			score: { $gt: userBestScore.score }
		});

		return betterScores + 1;
	} catch (error) {
		console.error('Get player rank error:', error);
		return null;
	}
}

// Helper function to update Redis cache
async function updateLeaderboardCache(): Promise<void> {
	try {
		// Clear existing cache
		const keys = await redis.keys('leaderboard:singleplayer:top-*');
		if (keys.length > 0) {
			await redis.del(...keys);
		}

		// Pre-populate common leaderboard sizes
		const sizes = [10, 25, 50, 100];
		for (const size of sizes) {
			const leaderboard = await LeaderboardEntry.find({ gameMode: 'singleplayer' })
				.sort({ score: -1 })
				.limit(size)
				.select('username score timeInMilliseconds date')
				.lean();

			const leaderboardWithRanks = leaderboard.map((entry, index) => ({
				...entry,
				rank: index + 1
			}));

			const cacheKey = `leaderboard:singleplayer:top-${size}`;
			await redis.setex(cacheKey, 300, JSON.stringify(leaderboardWithRanks)); // 5 minutes
		}
	} catch (error) {
		console.error('Update leaderboard cache error:', error);
		throw error; // Re-throw so the calling function knows Redis failed
	}
}

export default router;
