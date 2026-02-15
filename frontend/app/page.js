'use client';

import { useState } from 'react';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5001').replace(/\/$/, '');

const FEATURE_SPOTLIGHT = [
  {
    id: 'tool-image-pdf',
    title: 'Image -> PDF',
    hint: 'Merge many images into one PDF',
    icon: 'IP',
  },
  {
    id: 'tool-pdf-images',
    title: 'PDF -> Images',
    hint: 'PNG, JPG, ZIP, or direct payload',
    icon: 'PI',
  },
  {
    id: 'tool-pdf-word',
    title: 'PDF -> Word',
    hint: 'Convert to editable DOCX',
    icon: 'PW',
  },
  {
    id: 'tool-image-format',
    title: 'PNG <-> JPG',
    hint: 'Quick image re-encoding',
    icon: 'IJ',
  },
  {
    id: 'tool-voice-text',
    title: 'Voice -> Text',
    hint: 'Whisper transcription output',
    icon: 'VT',
  },
  {
    id: 'tool-text-voice',
    title: 'Text/Doc -> Voice',
    hint: 'Generate MP3/WAV/AIFF',
    icon: 'TV',
  },
  {
    id: 'tool-youtube',
    title: 'YouTube Download',
    hint: 'Fetch MP4 or MP3 in one step',
    icon: 'YT',
  },
];

function parseFilename(dispositionHeader, fallbackName) {
  if (!dispositionHeader) {
    return fallbackName;
  }

  const utfMatch = dispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const plainMatch = dispositionHeader.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return fallbackName;
}

function inferFileName(contentType, fallbackName) {
  if (contentType.includes('application/pdf')) {
    return 'output.pdf';
  }

  if (contentType.includes('application/zip')) {
    return 'output.zip';
  }

  if (contentType.includes('image/png')) {
    return 'output.png';
  }

  if (contentType.includes('image/jpeg')) {
    return 'output.jpg';
  }

  if (contentType.includes('audio/mpeg')) {
    return 'output.mp3';
  }

  if (contentType.includes('audio/wav')) {
    return 'output.wav';
  }

  if (contentType.includes('audio/aiff')) {
    return 'output.aiff';
  }

  if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    return 'output.docx';
  }

  if (contentType.includes('multipart/mixed')) {
    return 'output.multipart';
  }

  if (contentType.includes('text/plain')) {
    return 'output.txt';
  }

  return fallbackName;
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function parseErrorResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data?.message || `Request failed (${response.status})`;
  }

  const text = await response.text();
  return text || `Request failed (${response.status})`;
}

async function requestDownload({ endpoint, method = 'POST', body, headers, fallbackName }) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    body,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const contentType = response.headers.get('content-type') || '';
  const disposition = response.headers.get('content-disposition') || '';
  const blob = await response.blob();

  const guessed = inferFileName(contentType, fallbackName);
  const fileName = parseFilename(disposition, guessed);

  downloadBlob(blob, fileName);

  return {
    fileName,
    contentType,
    size: blob.size,
  };
}

function StatusLine({ status }) {
  if (!status) {
    return null;
  }

  return <p className={`status status-${status.type}`}>{status.message}</p>;
}

function ToolCard({ id, title, subtitle, icon, children, delay = 0 }) {
  return (
    <section id={id} className="tool-card" style={{ animationDelay: `${delay}ms` }}>
      <header className="tool-header">
        <div className="tool-title-row">
          <span className="tool-icon" aria-hidden="true">
            {icon}
          </span>
          <h2>{title}</h2>
        </div>
        <p>{subtitle}</p>
      </header>
      <div className="tool-content">{children}</div>
    </section>
  );
}

export default function HomePage() {
  const [imagesToPdfFiles, setImagesToPdfFiles] = useState([]);
  const [imagesToPdfLoading, setImagesToPdfLoading] = useState(false);
  const [imagesToPdfStatus, setImagesToPdfStatus] = useState(null);

  const [pdfToImagesFile, setPdfToImagesFile] = useState(null);
  const [pdfToImagesFormat, setPdfToImagesFormat] = useState('both');
  const [pdfToImagesDelivery, setPdfToImagesDelivery] = useState('zip');
  const [pdfToImagesLoading, setPdfToImagesLoading] = useState(false);
  const [pdfToImagesStatus, setPdfToImagesStatus] = useState(null);

  const [pdfToWordFile, setPdfToWordFile] = useState(null);
  const [pdfToWordLoading, setPdfToWordLoading] = useState(false);
  const [pdfToWordStatus, setPdfToWordStatus] = useState(null);

  const [imageFormatFile, setImageFormatFile] = useState(null);
  const [imageTargetFormat, setImageTargetFormat] = useState('jpg');
  const [imageFormatLoading, setImageFormatLoading] = useState(false);
  const [imageFormatStatus, setImageFormatStatus] = useState(null);

  const [voiceToTextFile, setVoiceToTextFile] = useState(null);
  const [voiceToTextOutput, setVoiceToTextOutput] = useState('txt');
  const [voiceToTextLoading, setVoiceToTextLoading] = useState(false);
  const [voiceToTextStatus, setVoiceToTextStatus] = useState(null);

  const [toVoiceMode, setToVoiceMode] = useState('text');
  const [toVoiceText, setToVoiceText] = useState('');
  const [toVoiceFile, setToVoiceFile] = useState(null);
  const [toVoiceOutput, setToVoiceOutput] = useState('mp3');
  const [toVoiceLoading, setToVoiceLoading] = useState(false);
  const [toVoiceStatus, setToVoiceStatus] = useState(null);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeType, setYoutubeType] = useState('mp4');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeStatus, setYoutubeStatus] = useState(null);

  async function handleImagesToPdf(event) {
    event.preventDefault();

    if (imagesToPdfFiles.length === 0) {
      setImagesToPdfStatus({ type: 'error', message: 'Select one or more PNG/JPG images first.' });
      return;
    }

    setImagesToPdfLoading(true);
    setImagesToPdfStatus(null);

    try {
      const formData = new FormData();
      for (const file of imagesToPdfFiles) {
        formData.append('images', file);
      }

      const result = await requestDownload({
        endpoint: '/api/convert/images-to-pdf',
        body: formData,
        fallbackName: 'converted.pdf',
      });

      setImagesToPdfStatus({ type: 'success', message: `Downloaded ${result.fileName}` });
    } catch (error) {
      setImagesToPdfStatus({ type: 'error', message: error.message });
    } finally {
      setImagesToPdfLoading(false);
    }
  }

  async function handlePdfToImages(event) {
    event.preventDefault();

    if (!pdfToImagesFile) {
      setPdfToImagesStatus({ type: 'error', message: 'Upload a PDF file to continue.' });
      return;
    }

    setPdfToImagesLoading(true);
    setPdfToImagesStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', pdfToImagesFile);
      formData.append('format', pdfToImagesFormat);
      formData.append('delivery', pdfToImagesDelivery);

      const fallbackName = pdfToImagesDelivery === 'zip' ? 'pdf-images.zip' : 'pdf-images.multipart';
      const result = await requestDownload({
        endpoint: '/api/convert/pdf-to-images',
        body: formData,
        fallbackName,
      });

      let message = `Downloaded ${result.fileName}`;
      if (result.contentType.includes('multipart/mixed')) {
        message += '. This is a multipart payload containing many images.';
      }

      setPdfToImagesStatus({ type: 'success', message });
    } catch (error) {
      setPdfToImagesStatus({ type: 'error', message: error.message });
    } finally {
      setPdfToImagesLoading(false);
    }
  }

  async function handlePdfToWord(event) {
    event.preventDefault();

    if (!pdfToWordFile) {
      setPdfToWordStatus({ type: 'error', message: 'Upload a PDF first.' });
      return;
    }

    setPdfToWordLoading(true);
    setPdfToWordStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', pdfToWordFile);

      const result = await requestDownload({
        endpoint: '/api/convert/pdf-to-word',
        body: formData,
        fallbackName: 'converted.docx',
      });

      setPdfToWordStatus({ type: 'success', message: `Downloaded ${result.fileName}` });
    } catch (error) {
      setPdfToWordStatus({ type: 'error', message: error.message });
    } finally {
      setPdfToWordLoading(false);
    }
  }

  async function handleImageFormat(event) {
    event.preventDefault();

    if (!imageFormatFile) {
      setImageFormatStatus({ type: 'error', message: 'Select an image file first.' });
      return;
    }

    setImageFormatLoading(true);
    setImageFormatStatus(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFormatFile);
      formData.append('targetFormat', imageTargetFormat);

      const result = await requestDownload({
        endpoint: '/api/convert/image-format',
        body: formData,
        fallbackName: `converted.${imageTargetFormat}`,
      });

      setImageFormatStatus({ type: 'success', message: `Downloaded ${result.fileName}` });
    } catch (error) {
      setImageFormatStatus({ type: 'error', message: error.message });
    } finally {
      setImageFormatLoading(false);
    }
  }

  async function handleVoiceToText(event) {
    event.preventDefault();

    if (!voiceToTextFile) {
      setVoiceToTextStatus({ type: 'error', message: 'Upload an audio file first.' });
      return;
    }

    setVoiceToTextLoading(true);
    setVoiceToTextStatus(null);

    try {
      const formData = new FormData();
      formData.append('audio', voiceToTextFile);
      formData.append('outputFormat', voiceToTextOutput);

      const result = await requestDownload({
        endpoint: '/api/speech/voice-to-text',
        body: formData,
        fallbackName: `transcript.${voiceToTextOutput}`,
      });

      setVoiceToTextStatus({ type: 'success', message: `Downloaded ${result.fileName}` });
    } catch (error) {
      setVoiceToTextStatus({ type: 'error', message: error.message });
    } finally {
      setVoiceToTextLoading(false);
    }
  }

  async function handleToVoice(event) {
    event.preventDefault();

    if (toVoiceMode === 'text' && !toVoiceText.trim()) {
      setToVoiceStatus({ type: 'error', message: 'Enter text to synthesize.' });
      return;
    }

    if (toVoiceMode === 'file' && !toVoiceFile) {
      setToVoiceStatus({ type: 'error', message: 'Upload a txt/pdf/docx file first.' });
      return;
    }

    setToVoiceLoading(true);
    setToVoiceStatus(null);

    try {
      const formData = new FormData();

      if (toVoiceMode === 'text') {
        formData.append('text', toVoiceText);
      } else {
        formData.append('file', toVoiceFile);
      }

      formData.append('outputFormat', toVoiceOutput);

      const result = await requestDownload({
        endpoint: '/api/speech/to-voice',
        body: formData,
        fallbackName: `speech.${toVoiceOutput}`,
      });

      setToVoiceStatus({ type: 'success', message: `Downloaded ${result.fileName}` });
    } catch (error) {
      setToVoiceStatus({ type: 'error', message: error.message });
    } finally {
      setToVoiceLoading(false);
    }
  }

  async function handleYoutubeDownload(event) {
    event.preventDefault();

    if (!youtubeUrl.trim()) {
      setYoutubeStatus({ type: 'error', message: 'Enter a valid YouTube URL.' });
      return;
    }

    setYoutubeLoading(true);
    setYoutubeStatus(null);

    try {
      const result = await requestDownload({
        endpoint: '/api/youtube/download',
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          type: youtubeType,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        fallbackName: youtubeType === 'mp3' ? 'youtube.mp3' : 'youtube.mp4',
      });

      setYoutubeStatus({ type: 'success', message: `Downloaded ${result.fileName}` });
    } catch (error) {
      setYoutubeStatus({ type: 'error', message: error.message });
    } finally {
      setYoutubeLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="background-orb orb-a" />
      <div className="background-orb orb-b" />

      <header className="hero">
        <p className="eyebrow">Technolaza Converter Suite</p>
        <h1>One workspace for every file, speech, and media conversion.</h1>
        <p className="hero-copy">
          Pick a capability card, jump into the exact tool, and download finished outputs instantly.
        </p>

        <div className="backend-note">
          <span className="pulse-dot" aria-hidden="true" />
          Connected to backend at <code>{API_BASE}</code>
        </div>

        <div className="feature-strip" aria-label="Feature shortcuts">
          {FEATURE_SPOTLIGHT.map((feature) => (
            <a key={feature.id} href={`#${feature.id}`} className="feature-pill">
              <span className="feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <span className="feature-text">
                <strong>{feature.title}</strong>
                <small>{feature.hint}</small>
              </span>
            </a>
          ))}
        </div>
      </header>

      <section className="tool-grid">
        <ToolCard
          id="tool-image-pdf"
          title="Image -> PDF"
          subtitle="Merge one or many PNG/JPG files into a single PDF."
          icon="IP"
          delay={0}
        >
          <form onSubmit={handleImagesToPdf}>
            <label>Images (multi-select)</label>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg"
              onChange={(event) => setImagesToPdfFiles(Array.from(event.target.files || []))}
            />
            <button type="submit" disabled={imagesToPdfLoading}>
              {imagesToPdfLoading ? 'Converting...' : 'Convert to PDF'}
            </button>
            <StatusLine status={imagesToPdfStatus} />
          </form>
        </ToolCard>

        <ToolCard
          id="tool-pdf-images"
          title="PDF -> Images"
          subtitle="Render PDF pages as PNG/JPG and choose ZIP or direct delivery."
          icon="PI"
          delay={80}
        >
          <form onSubmit={handlePdfToImages}>
            <label>PDF file</label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setPdfToImagesFile(event.target.files?.[0] || null)}
            />

            <label>Image format</label>
            <select value={pdfToImagesFormat} onChange={(event) => setPdfToImagesFormat(event.target.value)}>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="both">Both (PNG + JPG)</option>
            </select>

            <label>Delivery mode</label>
            <select value={pdfToImagesDelivery} onChange={(event) => setPdfToImagesDelivery(event.target.value)}>
              <option value="zip">ZIP (recommended)</option>
              <option value="direct">Direct response</option>
            </select>

            <button type="submit" disabled={pdfToImagesLoading}>
              {pdfToImagesLoading ? 'Rendering...' : 'Convert PDF to Images'}
            </button>
            <StatusLine status={pdfToImagesStatus} />
          </form>
        </ToolCard>

        <ToolCard
          id="tool-pdf-word"
          title="PDF -> Word"
          subtitle="Convert PDF layout into DOCX using LibreOffice."
          icon="PW"
          delay={160}
        >
          <form onSubmit={handlePdfToWord}>
            <label>PDF file</label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setPdfToWordFile(event.target.files?.[0] || null)}
            />
            <button type="submit" disabled={pdfToWordLoading}>
              {pdfToWordLoading ? 'Converting...' : 'Convert to DOCX'}
            </button>
            <StatusLine status={pdfToWordStatus} />
          </form>
        </ToolCard>

        <ToolCard
          id="tool-image-format"
          title="PNG <-> JPG"
          subtitle="Re-encode image formats with quality-safe defaults."
          icon="IJ"
          delay={240}
        >
          <form onSubmit={handleImageFormat}>
            <label>Image file</label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => setImageFormatFile(event.target.files?.[0] || null)}
            />

            <label>Target format</label>
            <select value={imageTargetFormat} onChange={(event) => setImageTargetFormat(event.target.value)}>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>

            <button type="submit" disabled={imageFormatLoading}>
              {imageFormatLoading ? 'Converting...' : 'Convert Image Format'}
            </button>
            <StatusLine status={imageFormatStatus} />
          </form>
        </ToolCard>

        <ToolCard
          id="tool-voice-text"
          title="Voice -> Text"
          subtitle="Offline Whisper transcription as TXT, DOCX, or PDF."
          icon="VT"
          delay={320}
        >
          <form onSubmit={handleVoiceToText}>
            <label>Audio file</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(event) => setVoiceToTextFile(event.target.files?.[0] || null)}
            />

            <label>Transcript output</label>
            <select value={voiceToTextOutput} onChange={(event) => setVoiceToTextOutput(event.target.value)}>
              <option value="txt">TXT</option>
              <option value="docx">DOCX</option>
              <option value="pdf">PDF</option>
            </select>

            <button type="submit" disabled={voiceToTextLoading}>
              {voiceToTextLoading ? 'Transcribing...' : 'Transcribe Audio'}
            </button>
            <StatusLine status={voiceToTextStatus} />
          </form>
        </ToolCard>

        <ToolCard
          id="tool-text-voice"
          title="Text/PDF/Word -> Voice"
          subtitle="Synthesize speech from typed text or extracted document text."
          icon="TV"
          delay={400}
        >
          <form onSubmit={handleToVoice}>
            <label>Input source</label>
            <div className="segmented">
              <button
                type="button"
                className={toVoiceMode === 'text' ? 'active' : ''}
                onClick={() => setToVoiceMode('text')}
              >
                Text
              </button>
              <button
                type="button"
                className={toVoiceMode === 'file' ? 'active' : ''}
                onClick={() => setToVoiceMode('file')}
              >
                File
              </button>
            </div>

            {toVoiceMode === 'text' ? (
              <>
                <label>Text content</label>
                <textarea
                  value={toVoiceText}
                  onChange={(event) => setToVoiceText(event.target.value)}
                  placeholder="Paste or type the text you want to convert into speech..."
                />
              </>
            ) : (
              <>
                <label>File (txt/pdf/docx)</label>
                <input
                  type="file"
                  accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => setToVoiceFile(event.target.files?.[0] || null)}
                />
              </>
            )}

            <label>Audio output</label>
            <select value={toVoiceOutput} onChange={(event) => setToVoiceOutput(event.target.value)}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="aiff">AIFF</option>
            </select>

            <button type="submit" disabled={toVoiceLoading}>
              {toVoiceLoading ? 'Generating...' : 'Generate Voice'}
            </button>
            <StatusLine status={toVoiceStatus} />
          </form>
        </ToolCard>

        <ToolCard
          id="tool-youtube"
          title="YouTube Download"
          subtitle="Download YouTube videos/shorts as MP4 video or MP3 audio."
          icon="YT"
          delay={480}
        >
          <form onSubmit={handleYoutubeDownload}>
            <label>YouTube URL</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />

            <label>Download type</label>
            <select value={youtubeType} onChange={(event) => setYoutubeType(event.target.value)}>
              <option value="mp4">MP4 (video)</option>
              <option value="mp3">MP3 (audio)</option>
            </select>

            <button type="submit" disabled={youtubeLoading}>
              {youtubeLoading ? 'Fetching...' : 'Download from YouTube'}
            </button>
            <StatusLine status={youtubeStatus} />
          </form>
        </ToolCard>
      </section>
    </main>
  );
}
