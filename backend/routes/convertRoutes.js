import { Router } from 'express';

import {
  imageFormatController,
  imagesToPdfController,
  pdfToImagesController,
  pdfToWordController,
} from '../controllers/convertController.js';
import upload from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/images-to-pdf', upload.array('images', 20), asyncHandler(imagesToPdfController));
router.post('/pdf-to-images', upload.single('file'), asyncHandler(pdfToImagesController));
router.post('/pdf-to-word', upload.single('file'), asyncHandler(pdfToWordController));
router.post('/image-format', upload.single('image'), asyncHandler(imageFormatController));

export default router;
