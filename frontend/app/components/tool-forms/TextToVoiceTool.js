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

export default function TextToVoiceTool({ tool }) {
  const job = useJob('Add text or upload a source file.');
  const [sourceMode, setSourceMode] = useState('text');
  const [files, setFiles] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [outputFormat, setOutputFormat] = useState('mp3');

  function onFilesChange(nextFiles, validationMessage) {
    if (validationMessage) {
      setFiles([]);
      job.setError(validationMessage);
      return;
    }

    setFiles(nextFiles);

    if (nextFiles.length > 0) {
      job.setReady('Ready to generate voice.');
    } else if (sourceMode === 'file') {
      job.reset('Upload a source file.');
    }
  }

  function updateSourceMode(nextMode) {
    setSourceMode(nextMode);

    if (nextMode === 'text') {
      setFiles([]);
      job.setReady(textContent.trim() ? 'Ready to generate voice.' : 'Type text to begin.');
      return;
    }

    job.reset('Upload a source file.');
  }

  async function startConversion() {
    if (sourceMode === 'text' && !textContent.trim()) {
      job.setError('Enter text first.');
      return;
    }

    if (sourceMode === 'file' && !files[0]) {
      job.setError('Upload one source file.');
      return;
    }

    await runJob({
      job,
      uploadText: sourceMode === 'file' ? 'Uploading source file...' : 'Preparing text...',
      processText: 'Generating voice output...',
      task: async () => {
        const formData = new FormData();
        if (sourceMode === 'text') {
          formData.append('text', textContent);
        } else {
          formData.append('file', files[0]);
        }
        formData.append('outputFormat', outputFormat);

        return fetchOutput({
          endpoint: '/api/speech/to-voice',
          body: formData,
          fallbackName: `speech.${outputFormat}`,
        });
      },
      onSuccess: (output) => {
        recordRecentActivity({
          toolName: 'Text/PDF/Word to Voice',
          outputName: output.fileName,
          sourceName: sourceMode === 'file' ? files[0]?.name || 'document' : 'typed text',
        });
      },
    });
  }

  function resetAll() {
    setSourceMode('text');
    setFiles([]);
    setTextContent('');
    setOutputFormat('mp3');
    job.reset('Add text or upload a source file.');
  }

  return (
    <div className="tool-body">
      <p className="flow-head">1. Input <span>→</span> 2. Options <span>→</span> 3. Download</p>

      <div className="tool-section">
        <p className="section-label">Input source</p>
        <OptionChips
          value={sourceMode}
          onChange={updateSourceMode}
          disabled={job.isBusy}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'file', label: 'File' },
          ]}
        />

        {sourceMode === 'text' ? (
          <textarea
            className="text-input"
            value={textContent}
            onChange={(event) => {
              setTextContent(event.target.value);
              if (event.target.value.trim()) {
                job.setReady('Ready to generate voice.');
              }
            }}
            placeholder="Type or paste text..."
            disabled={job.isBusy}
          />
        ) : (
          <DropzoneUploader
            files={files}
            onFilesChange={onFilesChange}
            accept={tool.accept}
            maxFiles={1}
            maxSizeMB={tool.maxSizeMB}
            disabled={job.isBusy}
            helper="Drop TXT, PDF, or DOCX"
            state={job.state}
          />
        )}
      </div>

      <div className="tool-section">
        <p className="section-label">Audio format</p>
        <OptionChips
          value={outputFormat}
          onChange={setOutputFormat}
          disabled={job.isBusy}
          options={[
            { value: 'mp3', label: 'MP3' },
            { value: 'wav', label: 'WAV' },
            { value: 'aiff', label: 'AIFF' },
          ]}
        />
      </div>

      <button type="button" className="btn-primary big" onClick={startConversion} disabled={job.isBusy}>
        {job.isBusy ? 'Generating...' : 'Generate voice'}
      </button>

      <StatusStrip state={job.state} message={job.message} />
      {job.state === 'success' && job.output ? <ResultCard output={job.output} onReset={resetAll} /> : null}
      {job.state === 'error' ? <ErrorBanner error={job.error} details={job.details} onRetry={startConversion} /> : null}
    </div>
  );
}
