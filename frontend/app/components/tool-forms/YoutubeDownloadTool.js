'use client';

import { useState } from 'react';

import ErrorBanner from '../ErrorBanner';
import OptionChips from '../OptionChips';
import ResultCard from '../ResultCard';
import StatusStrip from '../StatusStrip';
import { useJob } from '../../hooks/useJob';
import { fetchOutput } from '../../lib/apiClient';
import { recordRecentActivity } from '../../lib/recentActivity';
import { runJob } from '../../lib/runJob';

export default function YoutubeDownloadTool() {
  const job = useJob('Paste a YouTube URL to begin.');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('mp4');

  async function startConversion() {
    if (!url.trim()) {
      job.setError('Enter a valid YouTube URL.');
      return;
    }

    await runJob({
      job,
      uploadText: 'Submitting URL...',
      processText: 'Fetching streams with yt-dlp...',
      task: async () => {
        return fetchOutput({
          endpoint: '/api/youtube/download',
          body: JSON.stringify({ url: url.trim(), type }),
          headers: { 'Content-Type': 'application/json' },
          fallbackName: type === 'mp3' ? 'youtube.mp3' : 'youtube.mp4',
        });
      },
      onSuccess: (output) => {
        recordRecentActivity({
          toolName: 'YouTube Download',
          outputName: output.fileName,
          sourceName: url.trim(),
        });
      },
    });
  }

  function resetAll() {
    setUrl('');
    setType('mp4');
    job.reset('Paste a YouTube URL to begin.');
  }

  return (
    <div className="tool-body">
      <p className="flow-head">1. Input <span>→</span> 2. Options <span>→</span> 3. Download</p>

      <div className="tool-section">
        <label htmlFor="yt-url" className="section-label">
          YouTube URL
        </label>
        <input
          id="yt-url"
          className="text-input"
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (event.target.value.trim()) {
              job.setReady('Ready to download.');
            }
          }}
          placeholder="https://youtube.com/watch?v=..."
          disabled={job.isBusy}
        />
      </div>

      <div className="tool-section">
        <p className="section-label">Output format</p>
        <OptionChips
          value={type}
          onChange={setType}
          disabled={job.isBusy}
          options={[
            { value: 'mp4', label: 'MP4' },
            { value: 'mp3', label: 'MP3' },
          ]}
        />
      </div>

      <button type="button" className="btn-primary big" onClick={startConversion} disabled={job.isBusy || !url.trim()}>
        {job.isBusy ? 'Processing...' : 'Download from YouTube'}
      </button>

      <StatusStrip state={job.state} message={job.message} />
      {job.state === 'success' && job.output ? <ResultCard output={job.output} onReset={resetAll} /> : null}
      {job.state === 'error' ? <ErrorBanner error={job.error} details={job.details} onRetry={startConversion} /> : null}
    </div>
  );
}
