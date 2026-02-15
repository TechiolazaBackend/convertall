import {
  extractTextFromInput,
  synthesizeSpeech,
  transcribeAudio,
} from '../services/speechService.js';
import { cleanupTempDir } from '../utils/tempFiles.js';
import { sendDownloadAndCleanup } from '../utils/sendDownload.js';

export async function voiceToTextController(req, res) {
  const result = await transcribeAudio(req.file, req.body?.outputFormat);

  try {
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.buffer);
  } finally {
    await cleanupTempDir(result.tempDir);
  }
}

export async function toVoiceController(req, res, next) {
  const extractedText = await extractTextFromInput({
    text: req.body?.text,
    file: req.file,
  });

  const result = await synthesizeSpeech(extractedText, req.body?.outputFormat);
  sendDownloadAndCleanup(res, next, result);
}
