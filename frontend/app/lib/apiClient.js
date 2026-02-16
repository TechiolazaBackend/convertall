const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001').replace(/\/$/, '');

function parseFileName(disposition, fallback) {
  if (!disposition) {
    return fallback;
  }

  const utf = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) {
    return decodeURIComponent(utf[1]);
  }

  const plain = disposition.match(/filename="?([^";]+)"?/i);
  if (plain?.[1]) {
    return plain[1];
  }

  return fallback;
}

function inferName(contentType, fallback) {
  if (contentType.includes('application/pdf')) return 'output.pdf';
  if (contentType.includes('application/zip')) return 'output.zip';
  if (contentType.includes('image/png')) return 'output.png';
  if (contentType.includes('image/jpeg')) return 'output.jpg';
  if (contentType.includes('audio/mpeg')) return 'output.mp3';
  if (contentType.includes('audio/wav')) return 'output.wav';
  if (contentType.includes('audio/aiff')) return 'output.aiff';
  if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'output.docx';
  if (contentType.includes('multipart/mixed')) return 'output.multipart';
  if (contentType.includes('text/plain')) return 'output.txt';

  return fallback;
}

async function parseError(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json();
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.details = payload;
    return error;
  }

  const text = await response.text();
  const error = new Error(text || `Request failed (${response.status})`);
  error.details = { raw: text, status: response.status };
  return error;
}

export async function fetchOutput({ endpoint, method = 'POST', body, headers, fallbackName = 'output.bin' }) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    body,
    headers,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const contentType = response.headers.get('content-type') || '';
  const disposition = response.headers.get('content-disposition') || '';
  const blob = await response.blob();
  const fileName = parseFileName(disposition, inferName(contentType, fallbackName));
  const downloadUrl = URL.createObjectURL(blob);

  return {
    fileName,
    contentType,
    size: blob.size,
    blob,
    downloadUrl,
  };
}

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

export function triggerDownload(output) {
  if (!output?.downloadUrl) {
    return;
  }

  const link = document.createElement('a');
  link.href = output.downloadUrl;
  link.download = output.fileName || 'download.bin';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function formatBytes(size = 0) {
  if (!Number.isFinite(size) || size <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** exp;
  return `${value.toFixed(value >= 10 || exp === 0 ? 0 : 1)} ${units[exp]}`;
}

export function getApiBase() {
  return API_BASE;
}
