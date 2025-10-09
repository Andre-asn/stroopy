import express from 'express';
import { auth } from '../lib/auth';
import { APIError } from 'better-auth/api';

const router = express.Router();

// CORS middleware for auth routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://stroopy.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

/**
 * Authentication API Routes
 * 
 * Base URL: /api/v1/auth
 * 
 * Endpoints:
 * - POST /users - Create a new user account (sign up)
 * - POST /sessions - Create a new user session (sign in)
 * - DELETE /sessions - Delete current session (sign out)
 * - GET /sessions/current - Get current session information
 */

// Helper function to parse and set cookies from better-auth response headers
const setCookiesFromHeaders = (responseHeaders: Headers, res: express.Response) => {
	const setCookieHeader = responseHeaders.get('set-cookie');
	if (setCookieHeader) {
		// Parse the cookie and set it on our response
		const cookies = setCookieHeader.split(', ');
		cookies.forEach(cookie => {
			const [nameValue, ...attributes] = cookie.split('; ');
			const [name, value] = nameValue.split('=');
			if (name && value) {
				const cookieOptions: any = {};
				attributes.forEach(attr => {
					const [key, val] = attr.split('=');
					switch (key.toLowerCase()) {
						case 'max-age':
							cookieOptions.maxAge = parseInt(val || '0') * 1000;
							break;
						case 'domain':
							cookieOptions.domain = val;
							break;
						case 'path':
							cookieOptions.path = val;
							break;
						case 'secure':
							cookieOptions.secure = true;
							break;
						case 'httponly':
							cookieOptions.httpOnly = true;
							break;
						case 'samesite':
							cookieOptions.sameSite = val.toLowerCase();
							break;
					}
				});
				res.cookie(name, value, cookieOptions);
			}
		});
	}
};

// Helper function to create headers with cookies from request
const createHeadersWithCookies = (req: express.Request): Headers => {
	const headers = new Headers();
	const cookieString = Object.entries(req.cookies)
		.map(([key, value]) => `${key}=${value}`)
		.join('; ');
	
	if (cookieString) {
		headers.set('cookie', cookieString);
	}
	
	return headers;
};

// POST /api/v1/auth/users - Create a new user (sign up)
router.post('/users', async (req, res) => {
	try {
		const { email, name, password } = req.body;

		if (!email || !name || !password) {
			return res.status(400).json({ 
				error: 'Missing required fields: email, name, password' 
			});
		}

		// Use better-auth server-side API for sign up with headers
		const { headers: responseHeaders } = await auth.api.signUpEmail({
			body: {
				email,
				name,
				password,
			},
			returnHeaders: true
		});

		// Set cookies from better-auth response headers
		setCookiesFromHeaders(responseHeaders, res);

		// Get the actual result data
		const result = await auth.api.signUpEmail({
			body: {
				email,
				name,
				password,
			}
		});

		res.json({ 
			success: true, 
			user: result.user,
			session: result.token ? { token: result.token } : null
		});

	} catch (error: any) {
		console.error('Sign up error:', error);
		
		if (error instanceof APIError) {
			// Map better-auth status strings to HTTP status codes
			const statusCode = error.statusCode || 500;
			return res.status(statusCode).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Internal server error' });
	}
});

// POST /api/v1/auth/sessions - Create a new session (sign in)
router.post('/sessions', async (req, res) => {
	try {
		const { email, password, rememberMe } = req.body;

		if (!email || !password) {
			return res.status(400).json({ 
				error: 'Missing required fields: email, password' 
			});
		}

		// Use better-auth server-side API for sign in with headers
		const { headers: responseHeaders } = await auth.api.signInEmail({
			body: {
				email,
				password,
				rememberMe: rememberMe ?? true,
			},
			returnHeaders: true
		});

		// Set cookies from better-auth response headers
		setCookiesFromHeaders(responseHeaders, res);

		// Get the actual result data
		const result = await auth.api.signInEmail({
			body: {
				email,
				password,
				rememberMe: rememberMe ?? true,
			}
		});

		res.json({ 
			success: true, 
			user: result.user,
			session: result.token ? { token: result.token } : null
		});

	} catch (error: any) {
		console.error('Sign in error:', error);
		
		if (error instanceof APIError) {
			// Map better-auth status strings to HTTP status codes
			const statusCode = error.statusCode || 500;
			return res.status(statusCode).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Internal server error' });
	}
});

// DELETE /api/v1/auth/sessions - Delete current session (sign out)
router.delete('/sessions', async (req, res) => {
	try {
		// Create headers object with cookies from the request
		const headers = createHeadersWithCookies(req);

		// Use better-auth server-side API for sign out
		const { headers: responseHeaders } = await auth.api.signOut({
			headers,
			returnHeaders: true
		});

		// Set cookies from better-auth response headers (for clearing)
		setCookiesFromHeaders(responseHeaders, res);

		res.json({ success: true });
	} catch (error: any) {
		console.error('Sign out error:', error);
		
		if (error instanceof APIError) {
			// Map better-auth status strings to HTTP status codes
			const statusCode = error.statusCode || 500;
			return res.status(statusCode).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Internal server error' });
	}
});

// GET /api/v1/auth/sessions/current - Get current session information
router.get('/sessions/current', async (req, res) => {
	try {
		// Create headers object with cookies from the request
		const headers = createHeadersWithCookies(req);

		// Use better-auth to get session info
		const result = await auth.api.getSession({
			headers
		});

		res.json({ 
			user: result?.user || null,
			session: result?.session || null
		});

	} catch (error: any) {
		console.error('Get session error:', error);
		
		if (error instanceof APIError) {
			// Map better-auth status strings to HTTP status codes
			const statusCode = error.statusCode || 500;
			return res.status(statusCode).json({ error: error.message });
		}
		
		res.status(500).json({ error: 'Internal server error' });
	}
});

export default router;
