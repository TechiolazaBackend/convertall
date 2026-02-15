import {
  convertImageFormat,
  convertImagesToPdf,
  convertPdfToImages,
  convertPdfToWord,
} from '../services/conversionService.js';
import { sendDownloadAndCleanup, sendMultipartImagesAndCleanup } from '../utils/sendDownload.js';

export async function imagesToPdfController(req, res) {
  const pdfBuffer = await convertImagesToPdf(req.files || []);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
  res.send(pdfBuffer);
}

export async function pdfToImagesController(req, res, next) {
  const result = await convertPdfToImages(req.file, req.body?.format, req.body?.delivery);

  if (result.kind === 'multipart') {
    await sendMultipartImagesAndCleanup(res, next, result);
    return;
  }

  sendDownloadAndCleanup(res, next, result);
}

export async function pdfToWordController(req, res, next) {
  const result = await convertPdfToWord(req.file);
  sendDownloadAndCleanup(res, next, result);
}

export async function imageFormatController(req, res) {
  const result = await convertImageFormat(req.file, req.body?.targetFormat);

  res.setHeader('Content-Type', result.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
  res.send(result.buffer);
}
