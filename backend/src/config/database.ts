import mongoose from 'mongoose';
import Redis from 'ioredis';

// MongoDB connection
export const connectMongoDB = async () => {
	try {
		const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stroopy';
		await mongoose.connect(mongoUri);
		console.log('✅ Connected to MongoDB');
	} catch (error) {
		console.error('❌ MongoDB connection error:', error);
		process.exit(1);
	}
};

// Redis connection
export const redis = new Redis({
	host: process.env.REDIS_HOST || 'localhost',
	port: parseInt(process.env.REDIS_PORT || '6379'),
	password: process.env.REDIS_PASSWORD || undefined,
	maxRetriesPerRequest: 3,
	lazyConnect: true,
	tls: process.env.REDIS_HOST?.includes('cache.windows.net') ? {
		servername: process.env.REDIS_HOST
	} : undefined
});

redis.on('connect', () => {
	console.log('✅ Connected to Redis');
});

redis.on('error', (error) => {
	console.warn('⚠️ Redis connection error:', error);
	console.warn('⚠️ Application will continue without Redis caching');
});

redis.on('close', () => {
	console.warn('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
	console.log('🔄 Attempting to reconnect to Redis...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
	await mongoose.connection.close();
	await redis.disconnect();
	console.log('Database connections closed');
	process.exit(0);
});
