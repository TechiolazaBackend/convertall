import fs from 'node:fs/promises';
import path from 'node:path';

import { commandExists, runCommand } from '../utils/command.js';
import { HttpError } from '../utils/httpError.js';
import { createTempDir } from '../utils/tempFiles.js';

function isValidYoutubeUrl(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    return [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be',
      'www.youtu.be',
    ].includes(host);
  } catch {
    return false;
  }
}

function normalizeDownloadType(typeRaw) {
  const type = (typeRaw || 'mp4').toLowerCase();

  if (!['mp3', 'mp4'].includes(type)) {
    throw new HttpError(400, 'Invalid type. Use mp4 or mp3');
  }

  return type;
}

function getMimeType(filePath) {
  if (filePath.toLowerCase().endsWith('.mp3')) {
    return 'audio/mpeg';
  }

  return 'video/mp4';
}

async function ensureYtDlpRequirements(type) {
  const hasYtDlp = await commandExists('yt-dlp');
  if (!hasYtDlp) {
    throw new HttpError(500, 'yt-dlp is not installed or not available in PATH');
  }

  if (type === 'mp3' || type === 'mp4') {
    const hasFfmpeg = await commandExists('ffmpeg');
    if (!hasFfmpeg) {
      throw new HttpError(500, 'ffmpeg is required but is not available in PATH');
    }
  }

  if (type === 'mp4') {
    const hasFfprobe = await commandExists('ffprobe');
    if (!hasFfprobe) {
      throw new HttpError(500, 'ffprobe is required for mp4 validation but is not available in PATH');
    }
  }
}

function pickCandidateFile(files, preferredExts) {
  for (const ext of preferredExts) {
    const match = files.find((name) => name.toLowerCase().endsWith(ext));
    if (match) {
      return match;
    }
  }

  return files[0] || null;
}

async function findDownloadedMediaFile(tempDir, type) {
  const files = await fs.readdir(tempDir);
  const candidates = files.filter((name) => {
    const lower = name.toLowerCase();

    if (lower.endsWith('.part') || lower.endsWith('.ytdl') || lower.endsWith('.tmp')) {
      return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  if (type === 'mp3') {
    return pickCandidateFile(candidates, ['.mp3', '.m4a', '.aac', '.wav']);
  }

  return pickCandidateFile(candidates, ['.mp4', '.mkv', '.webm', '.mov', '.m4v']);
}

async function hasVideoStream(filePath) {
  const { stdout } = await runCommand('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=codec_name,width,height',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]);

  return stdout.trim().length > 0;
}

async function transcodeToPlayableMp4(inputPath, tempDir) {
  const outputPath = path.join(tempDir, 'youtube.mp4');

  await runCommand('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    outputPath,
  ]);

  return outputPath;
}

export async function downloadFromYoutube(url, typeRaw) {
  if (!url || !isValidYoutubeUrl(url)) {
    throw new HttpError(400, 'Invalid YouTube URL');
  }

  const type = normalizeDownloadType(typeRaw);
  await ensureYtDlpRequirements(type);

  const tempDir = await createTempDir('yt-download-');
  const outputTemplate = path.join(tempDir, 'media.%(ext)s');

  const args = ['--no-playlist', '-o', outputTemplate];

  if (type === 'mp3') {
    args.push('-x', '--audio-format', 'mp3');
  } else {
    args.push(
      '-f',
      'bv*[ext=mp4][vcodec*=avc1]+ba[ext=m4a]/bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b',
      '--merge-output-format',
      'mp4',
    );
  }

  args.push(url);

  await runCommand('yt-dlp', args);

  const preferred = await findDownloadedMediaFile(tempDir, type);
  if (!preferred) {
    throw new HttpError(500, 'Download finished but output file was not found');
  }

  let outputPath = path.join(tempDir, preferred);
  let downloadName = type === 'mp3' ? 'youtube.mp3' : 'youtube.mp4';

  if (type === 'mp4') {
    const hasVideo = await hasVideoStream(outputPath);

    if (!hasVideo) {
      throw new HttpError(
        500,
        'Downloaded mp4 has no video stream. Try another video or check yt-dlp source availability.',
      );
    }

    outputPath = await transcodeToPlayableMp4(outputPath, tempDir);
  }

  return {
    tempDir,
    outputPath,
    downloadName,
    mimeType: getMimeType(outputPath),
  };
}
