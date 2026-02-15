import { randomUUID } from 'node:crypto';

function summarizeValue(value) {
  if (typeof value === 'string') {
    return value.length <= 120 ? value : `${value.slice(0, 117)}...`;
  }

  if (Array.isArray(value)) {
    return `[array:${value.length}]`;
  }

  if (value && typeof value === 'object') {
    return '[object]';
  }

  return value;
}

function getBodySummary(body) {
  if (!body || typeof body !== 'object') {
    return { keys: [], sample: {} };
  }

  const keys = Object.keys(body);
  const sample = {};

  for (const key of keys.slice(0, 8)) {
    sample[key] = summarizeValue(body[key]);
  }

  return { keys, sample };
}

function normalizeUploadedFiles(req) {
  const fileList = [];

  if (req.file) {
    fileList.push(req.file);
  }

  if (Array.isArray(req.files)) {
    fileList.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    for (const value of Object.values(req.files)) {
      if (Array.isArray(value)) {
        fileList.push(...value);
      }
    }
  }

  return fileList.map((file) => ({
    field: file.fieldname,
    name: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  }));
}

export function requestLogger(req, res, next) {
  const requestId = randomUUID().slice(0, 8);
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const { keys, sample } = getBodySummary(req.body);

    const logPayload = {
      tag: 'request',
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      query: req.query,
      bodyKeys: keys,
      bodySample: sample,
      files: normalizeUploadedFiles(req),
    };

    console.log(JSON.stringify(logPayload));
  });

  next();
}
