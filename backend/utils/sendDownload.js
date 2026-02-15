import fs from 'node:fs/promises';

import { cleanupTempDir } from './tempFiles.js';

export function sendDownloadAndCleanup(res, next, payload) {
  const { outputPath, downloadName, tempDir, mimeType } = payload;

  if (mimeType) {
    res.type(mimeType);
  }

  res.download(outputPath, downloadName, async (error) => {
    await cleanupTempDir(tempDir);

    if (error && !res.headersSent) {
      next(error);
    }
  });
}

export async function sendMultipartImagesAndCleanup(res, next, payload) {
  const boundary = `TECHNOLAZA_BOUNDARY_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    res.status(200);
    res.setHeader('Content-Type', `multipart/mixed; boundary=${boundary}`);
    res.setHeader('Content-Disposition', 'inline; filename="pdf-images.multipart"');

    for (const file of payload.files || []) {
      const imageBuffer = await fs.readFile(file.path);

      res.write(`--${boundary}\r\n`);
      res.write(`Content-Type: ${file.mimeType}\r\n`);
      res.write(`Content-Disposition: attachment; filename="${file.name}"\r\n`);
      res.write(`Content-Length: ${imageBuffer.length}\r\n\r\n`);
      res.write(imageBuffer);
      res.write('\r\n');
    }

    res.end(`--${boundary}--\r\n`);
  } catch (error) {
    if (!res.headersSent) {
      next(error);
      return;
    }

    res.destroy(error);
  } finally {
    await cleanupTempDir(payload.tempDir);
  }
}
