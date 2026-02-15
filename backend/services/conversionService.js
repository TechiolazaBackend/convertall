import fs from 'node:fs/promises';
import path from 'node:path';

import { PDFDocument } from 'pdf-lib';
import { fromPath } from 'pdf2pic';
import sharp from 'sharp';

import { runCommand, commandExists } from '../utils/command.js';
import { HttpError } from '../utils/httpError.js';
import { createTempDir, getBaseNameWithoutExt } from '../utils/tempFiles.js';
import { createZipArchive } from '../utils/zip.js';

const DEFAULT_SOFFICE_BIN = '/Applications/LibreOffice.app/Contents/MacOS/soffice';

function getSofficeBin() {
  return process.env.SOFFICE_BIN || DEFAULT_SOFFICE_BIN;
}

function normalizeImageType(file) {
  const mimeType = (file.mimetype || '').toLowerCase();
  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return 'jpg';
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext === '.png') {
    return 'png';
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    return 'jpg';
  }

  return null;
}

export async function convertImagesToPdf(files) {
  if (!files || files.length === 0) {
    throw new HttpError(400, 'No images uploaded. Use form-data key: images');
  }

  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const imageType = normalizeImageType(file);
    if (!imageType) {
      throw new HttpError(400, `Only PNG and JPG are supported. Received: ${file.mimetype}`);
    }

    let embedded;
    if (imageType === 'png') {
      embedded = await pdfDoc.embedPng(file.buffer);
    } else {
      embedded = await pdfDoc.embedJpg(file.buffer);
    }

    const page = pdfDoc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }

  return Buffer.from(await pdfDoc.save());
}

async function ensurePdfToImageDependencies() {
  const [hasGm, hasGs] = await Promise.all([commandExists('gm'), commandExists('gs')]);

  if (!hasGm || !hasGs) {
    throw new HttpError(
      500,
      'PDF -> Image requires GraphicsMagick (gm) and Ghostscript (gs) installed and available in PATH.',
    );
  }
}

function getRequestedFormats(rawFormat) {
  const format = (rawFormat || 'png').toLowerCase();

  if (format === 'png' || format === 'jpg') {
    return [format];
  }

  if (format === 'both') {
    return ['png', 'jpg'];
  }

  throw new HttpError(400, 'Invalid format. Use png, jpg, or both');
}

function normalizeDeliveryMode(rawDeliveryMode) {
  const mode = (rawDeliveryMode || 'zip').toLowerCase();

  if (!['zip', 'direct'].includes(mode)) {
    throw new HttpError(400, 'Invalid delivery mode. Use zip or direct');
  }

  return mode;
}

function imageMimeTypeForFormat(format) {
  return format === 'png' ? 'image/png' : 'image/jpeg';
}

async function renderPdfToFormat(pdfPath, outputDir, format) {
  const converter = fromPath(pdfPath, {
    density: 170,
    savePath: outputDir,
    saveFilename: `page-${format}`,
    format,
    width: 1400,
    height: 2000,
  });

  const result = await converter.bulk(-1, { responseType: 'image' });
  return Array.isArray(result) ? result : [result];
}

export async function convertPdfToImages(pdfFile, outputFormat, deliveryModeRaw) {
  if (!pdfFile) {
    throw new HttpError(400, 'No PDF uploaded. Use form-data key: file');
  }

  const isPdf =
    (pdfFile.mimetype || '').toLowerCase().includes('pdf') ||
    path.extname(pdfFile.originalname || '').toLowerCase() === '.pdf';

  if (!isPdf) {
    throw new HttpError(400, 'Uploaded file is not a PDF');
  }

  await ensurePdfToImageDependencies();

  const formats = getRequestedFormats(outputFormat);
  const deliveryMode = normalizeDeliveryMode(deliveryModeRaw);
  const tempDir = await createTempDir('pdf-to-images-');
  const pdfPath = path.join(tempDir, 'input.pdf');

  await fs.writeFile(pdfPath, pdfFile.buffer);

  const zipEntries = [];
  const directEntries = [];

  for (const format of formats) {
    const formatDir = path.join(tempDir, format);
    await fs.mkdir(formatDir, { recursive: true });

    const pages = await renderPdfToFormat(pdfPath, formatDir, format);

    for (const page of pages) {
      if (!page?.path) {
        continue;
      }

      const archiveName = formats.length > 1
        ? `${format}/${path.basename(page.path)}`
        : path.basename(page.path);

      zipEntries.push({ path: page.path, name: archiveName });
      directEntries.push({
        path: page.path,
        name: path.basename(page.path),
        mimeType: imageMimeTypeForFormat(format),
      });
    }
  }

  if (zipEntries.length === 0) {
    throw new HttpError(500, 'No images were generated from PDF');
  }

  if (deliveryMode === 'direct') {
    if (directEntries.length === 1) {
      return {
        kind: 'file',
        tempDir,
        outputPath: directEntries[0].path,
        downloadName: directEntries[0].name,
        mimeType: directEntries[0].mimeType,
      };
    }

    return {
      kind: 'multipart',
      tempDir,
      files: directEntries,
    };
  }

  const zipPath = path.join(tempDir, 'pdf-images.zip');
  await createZipArchive(zipPath, zipEntries);

  return {
    kind: 'file',
    tempDir,
    outputPath: zipPath,
    downloadName: 'pdf-images.zip',
    mimeType: 'application/zip',
  };
}

async function resolveSofficeBinary() {
  const configured = getSofficeBin();

  try {
    await fs.access(configured);
    return configured;
  } catch {
    const inPath = await commandExists('soffice');
    if (inPath) {
      return 'soffice';
    }

    throw new HttpError(
      500,
      `LibreOffice not found. Set SOFFICE_BIN or install soffice. Tried: ${configured}`,
    );
  }
}

export async function convertPdfToWord(pdfFile) {
  if (!pdfFile) {
    throw new HttpError(400, 'No PDF uploaded. Use form-data key: file');
  }

  const isPdf =
    (pdfFile.mimetype || '').toLowerCase().includes('pdf') ||
    path.extname(pdfFile.originalname || '').toLowerCase() === '.pdf';

  if (!isPdf) {
    throw new HttpError(400, 'Uploaded file is not a PDF');
  }

  const sofficeBin = await resolveSofficeBinary();
  const tempDir = await createTempDir('pdf-to-word-');

  const inputName = getBaseNameWithoutExt(pdfFile.originalname || 'document') + '.pdf';
  const inputPath = path.join(tempDir, inputName);
  await fs.writeFile(inputPath, pdfFile.buffer);

  const args = [
    '--headless',
    '--infilter=writer_pdf_import',
    '--convert-to',
    'docx',
    '--outdir',
    tempDir,
    inputPath,
  ];

  await runCommand(sofficeBin, args);

  const expectedOutput = path.join(tempDir, `${getBaseNameWithoutExt(inputName)}.docx`);

  try {
    await fs.access(expectedOutput);
    return {
      tempDir,
      outputPath: expectedOutput,
      downloadName: `${getBaseNameWithoutExt(inputName)}.docx`,
    };
  } catch {
    const files = await fs.readdir(tempDir);
    const docxFile = files.find((name) => name.toLowerCase().endsWith('.docx'));

    if (!docxFile) {
      throw new HttpError(500, 'LibreOffice conversion completed but DOCX output not found');
    }

    const outputPath = path.join(tempDir, docxFile);
    return {
      tempDir,
      outputPath,
      downloadName: docxFile,
    };
  }
}

export async function convertImageFormat(imageFile, targetFormatRaw) {
  if (!imageFile) {
    throw new HttpError(400, 'No image uploaded. Use form-data key: image');
  }

  const targetFormat = (targetFormatRaw || '').toLowerCase();
  if (!['png', 'jpg', 'jpeg'].includes(targetFormat)) {
    throw new HttpError(400, 'Invalid target format. Use png or jpg');
  }

  const normalizedTarget = targetFormat === 'jpeg' ? 'jpg' : targetFormat;

  try {
    const outputBuffer = normalizedTarget === 'png'
      ? await sharp(imageFile.buffer).png().toBuffer()
      : await sharp(imageFile.buffer).jpeg({ quality: 92 }).toBuffer();

    return {
      buffer: outputBuffer,
      mimeType: normalizedTarget === 'png' ? 'image/png' : 'image/jpeg',
      fileName: `${getBaseNameWithoutExt(imageFile.originalname)}.${normalizedTarget}`,
    };
  } catch {
    throw new HttpError(400, 'Failed to convert image format. Ensure input is a valid image.');
  }
}
