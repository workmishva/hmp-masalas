import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized: Admin credentials are required' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Unsupported authorization type' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
  }

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    console.error('[verifyAdmin] ADMIN_JWT_SECRET is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Unauthorized: Invalid or expired admin token' });
  }
};
