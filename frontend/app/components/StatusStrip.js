'use client';

import { LoaderCircle } from 'lucide-react';

const LABELS = {
  idle: 'Idle',
  ready: 'Ready',
  uploading: 'Uploading',
  processing: 'Processing',
  success: 'Success',
  error: 'Error',
};

export default function StatusStrip({ state, message }) {
  return (
    <div className={`status-strip ${state}`}>
      <span className="state-label">{LABELS[state]}</span>
      <div className="state-message-wrap">
        {(state === 'uploading' || state === 'processing') ? <LoaderCircle size={14} className="spin-icon" /> : null}
        <span>{message}</span>
      </div>
    </div>
  );
}
