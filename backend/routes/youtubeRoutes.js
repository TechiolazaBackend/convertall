import { Router } from 'express';

import { youtubeDownloadController } from '../controllers/youtubeController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/download', asyncHandler(youtubeDownloadController));

export default router;
