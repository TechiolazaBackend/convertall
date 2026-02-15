import { downloadFromYoutube } from '../services/youtubeService.js';
import { sendDownloadAndCleanup } from '../utils/sendDownload.js';

export async function youtubeDownloadController(req, res, next) {
  const result = await downloadFromYoutube(req.body?.url, req.body?.type);
  sendDownloadAndCleanup(res, next, result);
}
