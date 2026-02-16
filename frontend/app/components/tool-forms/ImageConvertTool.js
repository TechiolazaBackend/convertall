'use client';

import { useState } from 'react';

import DropzoneUploader from '../DropzoneUploader';
import ErrorBanner from '../ErrorBanner';
import OptionChips from '../OptionChips';
import ResultCard from '../ResultCard';
import StatusStrip from '../StatusStrip';
import { useJob } from '../../hooks/useJob';
import { fetchOutput } from '../../lib/apiClient';
import { recordRecentActivity } from '../../lib/recentActivity';
import { runJob } from '../../lib/runJob';

export default function ImageConvertTool({ tool }) {
  const job = useJob('Drop PNG or JPG to begin.');
  const [files, setFiles] = useState([]);
  const [target, setTarget] = useState('jpg');

  function onFilesChange(nextFiles, validationMessage) {
    if (validationMessage) {
      setFiles([]);
      job.setError(validationMessage);
      return;
    }

    setFiles(nextFiles);

    if (nextFiles.length > 0) {
      job.setReady('Ready to convert image format.');
    } else {
      job.reset('Drop PNG or JPG to begin.');
    }
  }

  async function startConversion() {
    const file = files[0];

    if (!file) {
      job.setError('Upload one image file.');
      return;
    }

    await runJob({
      job,
      uploadText: 'Uploading image...',
      processText: 'Converting with Sharp...',
      task: async () => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('targetFormat', target);

        return fetchOutput({
          endpoint: '/api/convert/image-format',
          body: formData,
          fallbackName: `converted.${target}`,
        });
      },
      onSuccess: (output) => {
        recordRecentActivity({
          toolName: 'PNG ↔ JPG',
          outputName: output.fileName,
          sourceName: file.name,
        });
      },
    });
  }

  function resetAll() {
    setFiles([]);
    setTarget('jpg');
    job.reset('Drop PNG or JPG to begin.');
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
          helper="Drop your image"
          state={job.state}
        />
      </div>

      <div className="tool-section">
        <p className="section-label">Convert to</p>
        <OptionChips
          value={target}
          onChange={setTarget}
          disabled={job.isBusy}
          options={[
            { value: 'jpg', label: 'JPG' },
            { value: 'png', label: 'PNG' },
          ]}
        />
      </div>

      <button type="button" className="btn-primary big" onClick={startConversion} disabled={job.isBusy || files.length === 0}>
        {job.isBusy ? 'Converting...' : 'Convert image'}
      </button>

      <StatusStrip state={job.state} message={job.message} />
      {job.state === 'success' && job.output ? <ResultCard output={job.output} onReset={resetAll} /> : null}
      {job.state === 'error' ? <ErrorBanner error={job.error} details={job.details} onRetry={startConversion} /> : null}
    </div>
  );
}
