import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
	try {
		const { email, username, password } = req.body;

		// Validation
		if (!email || !username || !password) {
			return res.status(400).json({ error: 'Email, username, and password are required' });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: 'Password must be at least 6 characters' });
		}

		if (username.length < 3 || username.length > 20) {
			return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
		}

		// Check if user already exists
		const existingUser = await User.findOne({
			$or: [{ email: email.toLowerCase() }, { username }]
		});

		if (existingUser) {
			return res.status(400).json({ error: 'User with this email or username already exists' });
		}

		// Hash password
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create user
		const user = new User({
			email: email.toLowerCase(),
			username,
			password: hashedPassword
		});

		await user.save();

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET || 'your-secret-key',
			{ expiresIn: '7d' }
		);

		res.status(201).json({
			message: 'User created successfully',
			token,
			user: {
				id: user._id,
				email: user.email,
				username: user.username
			}
		});
	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Login user
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: 'Email and password are required' });
		}

		// Find user by email
		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET || 'your-secret-key',
			{ expiresIn: '7d' }
		);

		res.json({
			message: 'Login successful',
			token,
			user: {
				id: user._id,
				email: user.email,
				username: user.username
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
	try {
		const user = req.user;
		res.json({
			user: {
				id: user?._id,
				email: user?.email,
				username: user?.username,
				createdAt: user?.createdAt
			}
		});
	} catch (error) {
		console.error('Profile error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;
