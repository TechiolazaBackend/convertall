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

export default function ImageToPdfTool({ tool }) {
  const job = useJob('Drop JPG/PNG files to begin.');
  const [files, setFiles] = useState([]);

  function onFilesChange(nextFiles, validationMessage) {
    if (validationMessage) {
      setFiles([]);
      job.setError(validationMessage);
      return;
    }

    setFiles(nextFiles);

    if (nextFiles.length > 0) {
      job.setReady('Ready to merge images.');
    } else {
      job.reset('Drop JPG/PNG files to begin.');
    }
  }

  async function startConversion() {
    if (files.length === 0) {
      job.setError('Upload at least one image.');
      return;
    }

    await runJob({
      job,
      uploadText: 'Uploading images...',
      processText: 'Building PDF pages...',
      task: async () => {
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));

        return fetchOutput({
          endpoint: '/api/convert/images-to-pdf',
          body: formData,
          fallbackName: 'converted.pdf',
        });
      },
      onSuccess: (output) => {
        recordRecentActivity({
          toolName: 'Image to PDF',
          outputName: output.fileName,
          sourceName: files.length === 1 ? files[0].name : `${files.length} images`,
        });
      },
    });
  }

  function resetAll() {
    setFiles([]);
    job.reset('Drop JPG/PNG files to begin.');
  }

  return (
    <div className="tool-body">
      <p className="flow-head">1. Input <span>→</span> 2. Options <span>→</span> 3. Download</p>

      <div className="tool-section">
        <DropzoneUploader
          files={files}
          onFilesChange={onFilesChange}
          accept={tool.accept}
          maxFiles={tool.maxFiles}
          maxSizeMB={tool.maxSizeMB}
          disabled={job.isBusy}
          helper="Drop one or many images"
          state={job.state}
        />
      </div>

      <div className="tool-section">
        <p className="tiny-note">Images stay in upload order when merged.</p>
      </div>

      <button type="button" className="btn-primary big" onClick={startConversion} disabled={job.isBusy || files.length === 0}>
        {job.isBusy ? 'Converting...' : 'Convert to PDF'}
      </button>

      <StatusStrip state={job.state} message={job.message} />
      {job.state === 'success' && job.output ? <ResultCard output={job.output} onReset={resetAll} /> : null}
      {job.state === 'error' ? <ErrorBanner error={job.error} details={job.details} onRetry={startConversion} /> : null}
    </div>
  );
}
