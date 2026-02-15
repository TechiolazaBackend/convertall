import fs from 'node:fs/promises';
import path from 'node:path';

import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

import { commandExists, runCommand } from '../utils/command.js';
import { HttpError } from '../utils/httpError.js';
import { createTempDir } from '../utils/tempFiles.js';
import { textToDocxBuffer, textToPdfBuffer } from '../utils/textDocs.js';

const DEFAULT_WHISPER_BIN = 'whisper-cli';
const DEFAULT_WHISPER_MODEL_CANDIDATES = [
  '/Users/aditya4/ggml-base.en.bin',
  '/app/models/ggml-base.en.bin',
];

async function resolveWhisperBin() {
  const configured = process.env.WHISPER_BIN || DEFAULT_WHISPER_BIN;

  if (configured.includes('/')) {
    try {
      await fs.access(configured);
      return configured;
    } catch {
      throw new HttpError(
        500,
        `Whisper CLI not found. Set WHISPER_BIN or install whisper-cli. Tried: ${configured}`,
      );
    }
  }

  const inPath = await commandExists(configured);
  if (inPath) {
    return configured;
  }

  throw new HttpError(
    500,
    `Whisper CLI not found. Set WHISPER_BIN or install whisper-cli. Tried: ${configured}`,
  );
}

async function resolveWhisperModel() {
  const configuredCandidates = [
    process.env.WHISPER_MODEL,
    ...DEFAULT_WHISPER_MODEL_CANDIDATES,
    path.join(process.cwd(), 'models', 'ggml-base.en.bin'),
  ].filter(Boolean);

  for (const candidate of configuredCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new HttpError(
    500,
    `Whisper model not found. Set WHISPER_MODEL. Tried: ${configuredCandidates.join(', ')}`,
  );
}

function normalizeTranscriptOutputFormat(formatRaw) {
  const format = (formatRaw || 'txt').toLowerCase();

  if (!['txt', 'docx', 'pdf'].includes(format)) {
    throw new HttpError(400, 'Invalid outputFormat. Use txt, docx, or pdf');
  }

  return format;
}

export async function transcribeAudio(audioFile, outputFormatRaw) {
  if (!audioFile) {
    throw new HttpError(400, 'No audio uploaded. Use form-data key: audio');
  }

  const [whisperBin, whisperModel] = await Promise.all([
    resolveWhisperBin(),
    resolveWhisperModel(),
  ]);

  const tempDir = await createTempDir('voice-to-text-');
  const inputPath = path.join(tempDir, audioFile.originalname || 'input-audio.wav');
  const outputBase = path.join(tempDir, 'transcript');

  await fs.writeFile(inputPath, audioFile.buffer);

  await runCommand(whisperBin, ['-m', whisperModel, '-f', inputPath, '-of', outputBase, '-otxt']);

  const transcriptPath = `${outputBase}.txt`;
  let transcriptText;

  try {
    transcriptText = await fs.readFile(transcriptPath, 'utf8');
  } catch {
    throw new HttpError(500, 'Whisper finished but transcript output not found');
  }

  const outputFormat = normalizeTranscriptOutputFormat(outputFormatRaw);

  if (outputFormat === 'txt') {
    return {
      tempDir,
      buffer: Buffer.from(transcriptText, 'utf8'),
      mimeType: 'text/plain',
      fileName: 'transcript.txt',
    };
  }

  if (outputFormat === 'docx') {
    const docxBuffer = await textToDocxBuffer(transcriptText);
    return {
      tempDir,
      buffer: docxBuffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName: 'transcript.docx',
    };
  }

  const pdfBuffer = await textToPdfBuffer(transcriptText);
  return {
    tempDir,
    buffer: pdfBuffer,
    mimeType: 'application/pdf',
    fileName: 'transcript.pdf',
  };
}

function getExtension(fileName = '') {
  return path.extname(fileName).toLowerCase();
}

export async function extractTextFromInput({ text, file }) {
  if (typeof text === 'string' && text.trim().length > 0) {
    return text.trim();
  }

  if (!file) {
    throw new HttpError(400, 'Provide either text or a file (txt, pdf, docx)');
  }

  const mimeType = (file.mimetype || '').toLowerCase();
  const ext = getExtension(file.originalname);

  if (mimeType.includes('pdf') || ext === '.pdf') {
    const parser = new PDFParse({ data: file.buffer });
    const parsed = await parser.getText();
    await parser.destroy();

    const extracted = (parsed.text || '').trim();
    if (!extracted) {
      throw new HttpError(400, 'No extractable text found in PDF');
    }
    return extracted;
  }

  if (
    mimeType.includes('wordprocessingml.document') ||
    ext === '.docx'
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    const extracted = (result.value || '').trim();
    if (!extracted) {
      throw new HttpError(400, 'No extractable text found in DOCX');
    }
    return extracted;
  }

  if (mimeType.startsWith('text/') || ext === '.txt') {
    const extracted = file.buffer.toString('utf8').trim();
    if (!extracted) {
      throw new HttpError(400, 'Text file is empty');
    }
    return extracted;
  }

  throw new HttpError(400, 'Unsupported file type for speech. Use txt, pdf, or docx');
}

function normalizeAudioOutputFormat(formatRaw) {
  const format = (formatRaw || 'mp3').toLowerCase();

  if (!['mp3', 'wav', 'aiff'].includes(format)) {
    throw new HttpError(400, 'Invalid outputFormat. Use mp3, wav, or aiff');
  }

  return format;
}

async function convertAudioWithFfmpeg(inputPath, outputPath, format) {
  const hasFfmpeg = await commandExists('ffmpeg');
  if (!hasFfmpeg) {
    throw new HttpError(500, 'ffmpeg is required for this output format but is not available in PATH');
  }

  const args = ['-y', '-i', inputPath];

  if (format === 'mp3') {
    args.push('-codec:a', 'libmp3lame', '-q:a', '2');
  }

  args.push(outputPath);

  await runCommand('ffmpeg', args);
}

function mimeTypeForAudio(format) {
  if (format === 'wav') {
    return 'audio/wav';
  }

  if (format === 'aiff') {
    return 'audio/aiff';
  }

  return 'audio/mpeg';
}

export async function synthesizeSpeech(text, outputFormatRaw) {
  const cleanText = (text || '').trim();

  if (!cleanText) {
    throw new HttpError(400, 'No text available for speech synthesis');
  }

  const outputFormat = normalizeAudioOutputFormat(outputFormatRaw);
  const tempDir = await createTempDir('text-to-voice-');
  const inputTextPath = path.join(tempDir, 'input.txt');

  await fs.writeFile(inputTextPath, cleanText, 'utf8');

  if (process.platform === 'darwin') {
    const hasSay = await commandExists('say');
    if (!hasSay) {
      throw new HttpError(500, 'macOS say command not found');
    }

    const rawAiffPath = path.join(tempDir, 'speech.aiff');
    await runCommand('say', ['-f', inputTextPath, '-o', rawAiffPath]);

    if (outputFormat === 'aiff') {
      return {
        tempDir,
        outputPath: rawAiffPath,
        fileName: 'speech.aiff',
        mimeType: 'audio/aiff',
      };
    }

    const convertedPath = path.join(tempDir, `speech.${outputFormat}`);
    await convertAudioWithFfmpeg(rawAiffPath, convertedPath, outputFormat);

    return {
      tempDir,
      outputPath: convertedPath,
      fileName: `speech.${outputFormat}`,
      mimeType: mimeTypeForAudio(outputFormat),
    };
  }

  if (process.platform === 'linux') {
    const hasEspeak = await commandExists('espeak');
    if (!hasEspeak) {
      throw new HttpError(500, 'Linux espeak command not found');
    }

    const rawWavPath = path.join(tempDir, 'speech.wav');
    await runCommand('espeak', ['-f', inputTextPath, '-w', rawWavPath]);

    if (outputFormat === 'wav') {
      return {
        tempDir,
        outputPath: rawWavPath,
        fileName: 'speech.wav',
        mimeType: 'audio/wav',
      };
    }

    const convertedPath = path.join(tempDir, `speech.${outputFormat}`);
    await convertAudioWithFfmpeg(rawWavPath, convertedPath, outputFormat);

    return {
      tempDir,
      outputPath: convertedPath,
      fileName: `speech.${outputFormat}`,
      mimeType: mimeTypeForAudio(outputFormat),
    };
  }

  throw new HttpError(500, 'Unsupported OS for text-to-speech. Use macOS or Linux.');
}
