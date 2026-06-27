import express from 'express';
import { loginAdmin, googleLoginAdmin } from '../controllers/adminAuthController';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/google-login', googleLoginAdmin);

export default router;
