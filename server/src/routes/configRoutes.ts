import express from 'express';
import { getConfig, updateConfig } from '../controllers/configController';
import { verifyAdmin } from '../middlewares/verifyAdmin';

const router = express.Router();

router.get('/', getConfig);
router.patch('/', verifyAdmin, updateConfig);

export default router;
