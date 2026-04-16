import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdmin';
import User from '../models/User';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'HMP@123';

function parseBasicAuth(authorizationHeader: string) {
  if (!authorizationHeader.startsWith('Basic ')) {
    return null;
  }

  const base64Credentials = authorizationHeader.slice('Basic '.length).trim();
  if (!base64Credentials) {
    return null;
  }

  let decoded = '';
  try {
    decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex < 0) {
    return null;
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}

async function verifyFirebaseAdmin(idToken: string) {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const user = await User.findOne({ firebaseUid: decodedToken.uid }).select({ role: 1 }).lean();
  if (!user || user.role !== 'admin') {
    return null;
  }
  return decodedToken;
}

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Admin credentials are required' });
  }

  // Preferred: Firebase token + admin role in DB.
  if (authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice('Bearer '.length).trim();
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
    }

    try {
      const decodedAdmin = await verifyFirebaseAdmin(idToken);
      if (!decodedAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      (req as any).user = decodedAdmin;
      return next();
    } catch (error) {
      console.error('Error verifying Firebase admin token:', error);
      return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
  }

  // Compatibility mode: Basic auth using admin panel credentials.
  if (authHeader.startsWith('Basic ')) {
    const parsedCredentials = parseBasicAuth(authHeader);
    if (!parsedCredentials) {
      return res.status(401).json({ error: 'Unauthorized: Invalid basic auth format' });
    }

    const expectedUsername = process.env.ADMIN_USERNAME ?? DEFAULT_ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
    const isValidCredential =
      parsedCredentials.username === expectedUsername &&
      parsedCredentials.password === expectedPassword;

    if (!isValidCredential) {
      return res.status(403).json({ error: 'Forbidden: Invalid admin credentials' });
    }

    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Unsupported authorization type' });
};
