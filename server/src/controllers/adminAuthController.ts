import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import admin from '../config/firebaseAdmin';

const generateAdminJwt = (username: string, secret: string) => {
  return jwt.sign(
    { username, role: 'admin' },
    secret,
    { expiresIn: '24h' }
  );
};

// POST /api/admin/login — username + password login
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const expectedUsername = process.env.ADMIN_ID || 'admin';

    if (username !== expectedUsername) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash) {
      console.error('ADMIN_PASSWORD_HASH is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const isMatch = await bcrypt.compare(password, hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      console.error('ADMIN_JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = generateAdminJwt(username, secret);
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error during admin login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/google-login — Google Firebase token admin login
export const googleLoginAdmin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    const authorizedEmail = process.env.ADMIN_GOOGLE_EMAIL;
    if (!authorizedEmail) {
      console.error('ADMIN_GOOGLE_EMAIL is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      console.error('ADMIN_JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email || email.toLowerCase() !== authorizedEmail.toLowerCase()) {
      console.warn(`[Admin Google Login] Unauthorized attempt from: ${email}`);
      return res.status(403).json({ error: 'This Google account is not authorized as admin.' });
    }

    const token = generateAdminJwt(email, secret);
    console.log(`[Admin Google Login] Successful admin login from Google account: ${email}`);
    return res.status(200).json({ token });
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Google session expired. Please sign in again.' });
    }
    console.error('Error during Google admin login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
