'use client';

import { FileUp, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { formatBytes } from '../lib/apiClient';
import { validateFiles } from '../lib/fileValidation';

function acceptToLabel(accept = []) {
  if (!accept.length) {
    return 'Any file type';
  }

  return accept
    .map((item) => item.replace('image/', '').replace('audio/', '').replace('application/', '').replace('.', '').toUpperCase())
    .join(' • ');
}

export default function DropzoneUploader({
  files = [],
  onFilesChange,
  accept = [],
  maxFiles = 1,
  maxSizeMB = 100,
  disabled = false,
  helper = 'Drop files here',
  state = 'idle',
}) {
  const inputRef = useRef(null);
  const [isHover, setIsHover] = useState(false);

  function pickFiles(fileList) {
    const result = validateFiles({ files: fileList, accept, maxFiles, maxSizeMB });

    if (!result.valid) {
      onFilesChange([], result.message);
      return;
    }

    onFilesChange(result.files, '');
  }

  function handleDrop(event) {
    event.preventDefault();
    if (disabled) {
      return;
    }

    setIsHover(false);
    pickFiles(event.dataTransfer.files);
  }

  function handleBrowseChange(event) {
    pickFiles(event.target.files);

    if (event.target) {
      event.target.value = '';
    }
  }

  function removeAt(index) {
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next, '');
  }

  return (
    <div className={`dropzone-wrap ${state}`}>
      <div
        className={`dropzone ${isHover ? 'hover' : ''} ${files.length > 0 ? 'has-file' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsHover(true);
          }
        }}
        onDragLeave={() => setIsHover(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-disabled={disabled}
      >
        <span className="dz-icon" aria-hidden="true">
          <UploadCloud size={34} />
        </span>

        <span className="dz-main">{files.length > 0 ? 'File selected' : helper}</span>
        <small className="dz-sub">Drag and drop or browse</small>

        <span className="dz-meta">{acceptToLabel(accept)} • Up to {maxSizeMB}MB</span>

        <span className="dz-browse" onClick={(event) => event.stopPropagation()}>
          <span>or</span>
          <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()} disabled={disabled}>
            <FileUp size={14} />
            Browse
          </button>
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="visually-hidden"
        multiple={maxFiles > 1}
        accept={accept.join(',')}
        onChange={handleBrowseChange}
        disabled={disabled}
      />

      {files.length > 0 ? (
        <div className="file-pill-list">
          {files.map((file, index) => (
            <span key={`${file.name}-${index}`} className="file-pill">
              <span>{file.name}</span>
              <small>{formatBytes(file.size)}</small>
              <button type="button" onClick={() => removeAt(index)} aria-label={`Remove ${file.name}`}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
