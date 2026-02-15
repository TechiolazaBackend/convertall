import { Router } from 'express';

import { toVoiceController, voiceToTextController } from '../controllers/speechController.js';
import upload from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/voice-to-text', upload.single('audio'), asyncHandler(voiceToTextController));
router.post('/to-voice', upload.single('file'), asyncHandler(toVoiceController));

export default router;
