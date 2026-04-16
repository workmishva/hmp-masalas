import { Router } from 'express';
import { upsertUser, getMyProfile, updateMyProfile } from '../controllers/userController';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();

// All user routes require a valid Firebase token
router.use(verifyToken);

// POST /api/users/me — Create profile after first sign-in (signup)
router.post('/me', upsertUser);

// GET /api/users/me — Get profile + order history
router.get('/me', getMyProfile);

// PATCH /api/users/me — Update profile info
router.patch('/me', updateMyProfile);

export default router;
