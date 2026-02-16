'use client';

import { useState } from 'react';

import DropzoneUploader from '../DropzoneUploader';
import ErrorBanner from '../ErrorBanner';
import MinimalSelect from '../MinimalSelect';
import OptionChips from '../OptionChips';
import ResultCard from '../ResultCard';
import StatusStrip from '../StatusStrip';
import { useJob } from '../../hooks/useJob';
import { fetchOutput } from '../../lib/apiClient';
import { recordRecentActivity } from '../../lib/recentActivity';
import { runJob } from '../../lib/runJob';

export default function PdfToImagesTool({ tool }) {
  const job = useJob('Drop a PDF to begin.');
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState('both');
  const [delivery, setDelivery] = useState('zip');

  function onFilesChange(nextFiles, validationMessage) {
    if (validationMessage) {
      setFiles([]);
      job.setError(validationMessage);
      return;
    }

    setFiles(nextFiles);

    if (nextFiles.length > 0) {
      job.setReady('Ready to render pages.');
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
      processText: 'Rendering pages with Ghostscript...',
      task: async () => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);
        formData.append('delivery', delivery);

        return fetchOutput({
          endpoint: '/api/convert/pdf-to-images',
          body: formData,
          fallbackName: delivery === 'zip' ? 'pdf-images.zip' : 'pdf-images.multipart',
        });
      },
      onSuccess: (output) => {
        recordRecentActivity({
          toolName: 'PDF to Images',
          outputName: output.fileName,
          sourceName: file.name,
        });
      },
    });
  }

  function resetAll() {
    setFiles([]);
    setFormat('both');
    setDelivery('zip');
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
        <p className="section-label">Image format</p>
        <OptionChips
          value={format}
          onChange={setFormat}
          disabled={job.isBusy}
          options={[
            { value: 'png', label: 'PNG' },
            { value: 'jpg', label: 'JPG' },
            { value: 'both', label: 'Both' },
          ]}
        />

        <details className="advanced-box">
          <summary>Advanced options</summary>
          <MinimalSelect
            value={delivery}
            onChange={setDelivery}
            disabled={job.isBusy}
            options={[
              { value: 'zip', label: 'Download ZIP' },
              { value: 'direct', label: 'Direct payload' },
            ]}
          />
        </details>
      </div>

      <button type="button" className="btn-primary big" onClick={startConversion} disabled={job.isBusy || files.length === 0}>
        {job.isBusy ? 'Converting...' : 'Convert PDF to images'}
      </button>

      <StatusStrip state={job.state} message={job.message} />
      {job.state === 'success' && job.output ? <ResultCard output={job.output} onReset={resetAll} /> : null}
      {job.state === 'error' ? <ErrorBanner error={job.error} details={job.details} onRetry={startConversion} /> : null}
    </div>
  );
}
