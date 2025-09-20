import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaderboardEntry extends Document {
	userId: mongoose.Types.ObjectId;
	username: string;
	score: number;
	timeInMilliseconds: number;
	date: Date;
	gameMode: 'singleplayer';
}

const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	username: {
		type: String,
		required: true
	},
	score: {
		type: Number,
		required: true,
		min: 0
	},
	timeInMilliseconds: {
		type: Number,
		required: true,
		min: 0
	},
	date: {
		type: Date,
		default: Date.now
	},
	gameMode: {
		type: String,
		enum: ['singleplayer'],
		default: 'singleplayer'
	}
}, {
	timestamps: true
});

// Index for efficient leaderboard queries
LeaderboardEntrySchema.index({ gameMode: 1, score: -1, date: -1 });

export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>('LeaderboardEntry', LeaderboardEntrySchema);
