'use client';

import { CheckCircle2, Copy, Download, FileBadge } from 'lucide-react';
import { useState } from 'react';

import { formatBytes, triggerDownload } from '../lib/apiClient';

export default function ResultCard({ output, onReset }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!output?.downloadUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(output.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="result-card">
      <div className="result-head">
        <CheckCircle2 size={18} />
        <span>Ready to download</span>
      </div>

      <div className="result-file">
        <FileBadge size={20} />
        <div>
          <p className="result-name">{output.fileName}</p>
          <p className="result-meta">
            {output.contentType} • {formatBytes(output.size)}
          </p>
        </div>
      </div>

      <div className="result-actions">
        <button type="button" className="btn-primary big" onClick={() => triggerDownload(output)}>
          <Download size={16} />
          Download
        </button>
        <button type="button" className="btn-secondary" onClick={handleCopy}>
          <Copy size={14} />
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button type="button" className="btn-ghost" onClick={onReset}>
          Convert another
        </button>
      </div>
    </div>
  );
}
