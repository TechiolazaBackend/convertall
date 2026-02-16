'use client';

import { useState } from 'react';

import DropzoneUploader from '../DropzoneUploader';
import ErrorBanner from '../ErrorBanner';
import ResultCard from '../ResultCard';
import StatusStrip from '../StatusStrip';
import { useJob } from '../../hooks/useJob';
import { fetchOutput } from '../../lib/apiClient';
import { recordRecentActivity } from '../../lib/recentActivity';
import { runJob } from '../../lib/runJob';

export default function PdfToWordTool({ tool }) {
  const job = useJob('Drop a PDF to begin.');
  const [files, setFiles] = useState([]);

  function onFilesChange(nextFiles, validationMessage) {
    if (validationMessage) {
      setFiles([]);
      job.setError(validationMessage);
      return;
    }

    setFiles(nextFiles);

    if (nextFiles.length > 0) {
      job.setReady('Ready to convert to Word.');
    } else {
      job.reset('Drop a PDF to begin.');
    }
  }

  async function startConversion() {
    const file = files[0];
    if (!file) {
      job.setError('Upload one PDF file.');
      return;
    }

    await runJob({
      job,
      uploadText: 'Uploading PDF...',
      processText: 'Converting with LibreOffice...',
      task: async () => {
        const formData = new FormData();
        formData.append('file', file);

        return fetchOutput({
          endpoint: '/api/convert/pdf-to-word',
          body: formData,
          fallbackName: 'converted.docx',
        });
      },
      onSuccess: (output) => {
        recordRecentActivity({
          toolName: 'PDF to Word',
          outputName: output.fileName,
          sourceName: file.name,
        });
      },
    });
  }

  function resetAll() {
    setFiles([]);
    job.reset('Drop a PDF to begin.');
  }

  return (
    <div className="tool-body">
      <p className="flow-head">1. Input <span>→</span> 2. Options <span>→</span> 3. Download</p>

      <div className="tool-section">
        <DropzoneUploader
          files={files}
          onFilesChange={onFilesChange}
          accept={tool.accept}
          maxFiles={1}
          maxSizeMB={tool.maxSizeMB}
          disabled={job.isBusy}
          helper="Drop your PDF"
          state={job.state}
        />
      </div>

      <div className="tool-section">
        <p className="tiny-note">Best results with text-based PDFs (not scanned pages).</p>
      </div>

      <button type="button" className="btn-primary big" onClick={startConversion} disabled={job.isBusy || files.length === 0}>
        {job.isBusy ? 'Converting...' : 'Convert to Word (.docx)'}
      </button>

      <StatusStrip state={job.state} message={job.message} />
      {job.state === 'success' && job.output ? <ResultCard output={job.output} onReset={resetAll} /> : null}
      {job.state === 'error' ? <ErrorBanner error={job.error} details={job.details} onRetry={startConversion} /> : null}
    </div>
  );
}
