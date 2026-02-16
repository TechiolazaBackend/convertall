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

export default function VoiceToTextTool({ tool }) {
  const job = useJob('Drop an audio file to begin.');
  const [files, setFiles] = useState([]);
  const [outputFormat, setOutputFormat] = useState('txt');

  function onFilesChange(nextFiles, validationMessage) {
    if (validationMessage) {
      setFiles([]);
      job.setError(validationMessage);
      return;
    }

    setFiles(nextFiles);

    if (nextFiles.length > 0) {
      job.setReady('Ready to transcribe.');
    } else {
      job.reset('Drop an audio file to begin.');
    }
  }

  async function startConversion() {
    const file = files[0];
    if (!file) {
      job.setError('Upload one audio file.');
      return;
    }

    await runJob({
      job,
      uploadText: 'Uploading audio...',
      processText: 'Transcribing with Whisper...',
      task: async () => {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('outputFormat', outputFormat);

        return fetchOutput({
          endpoint: '/api/speech/voice-to-text',
          body: formData,
          fallbackName: `transcript.${outputFormat}`,
        });
      },
      onSuccess: (output) => {
        recordRecentActivity({
          toolName: 'Voice to Text',
          outputName: output.fileName,
          sourceName: file.name,
        });
      },
    });
  }

  function resetAll() {
    setFiles([]);
    setOutputFormat('txt');
    job.reset('Drop an audio file to begin.');
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
          helper="Drop audio file"
          state={job.state}
        />
      </div>

      <div className="tool-section">
        <p className="section-label">Transcript format</p>
        <OptionChips
          value={outputFormat}
          onChange={setOutputFormat}
          disabled={job.isBusy}
          options={[
            { value: 'txt', label: 'TXT' },
            { value: 'docx', label: 'DOCX' },
            { value: 'pdf', label: 'PDF' },
          ]}
        />
      </div>

      <button type="button" className="btn-primary big" onClick={startConversion} disabled={job.isBusy || files.length === 0}>
        {job.isBusy ? 'Transcribing...' : 'Transcribe audio'}
      </button>

      <StatusStrip state={job.state} message={job.message} />
      {job.state === 'success' && job.output ? <ResultCard output={job.output} onReset={resetAll} /> : null}
      {job.state === 'error' ? <ErrorBanner error={job.error} details={job.details} onRetry={startConversion} /> : null}
    </div>
  );
}
