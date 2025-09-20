import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
	user?: IUser;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

	if (!token) {
		return res.status(401).json({ error: 'Access token required' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };
		const user = await User.findById(decoded.userId);
		
		if (!user) {
			return res.status(401).json({ error: 'Invalid token' });
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(403).json({ error: 'Invalid or expired token' });
	}
};
