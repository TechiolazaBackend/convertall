'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const INITIAL = {
  state: 'idle',
  message: 'Drop a file to begin.',
  output: null,
  error: '',
  details: null,
};

function revokeOutput(output) {
  if (output?.downloadUrl && String(output.downloadUrl).startsWith('blob:')) {
    URL.revokeObjectURL(output.downloadUrl);
  }
}

export function useJob(initialMessage = 'Drop a file to begin.') {
  const [job, setJob] = useState({ ...INITIAL, message: initialMessage });
  const outputRef = useRef(null);

  const setReady = useCallback((message = 'Ready to convert.') => {
    setJob((prev) => ({ ...prev, state: 'ready', message, error: '', details: null }));
  }, []);

  const setUploading = useCallback((message = 'Uploading...') => {
    setJob((prev) => ({ ...prev, state: 'uploading', message, error: '', details: null }));
  }, []);

  const setProcessing = useCallback((message = 'Processing...') => {
    setJob((prev) => ({ ...prev, state: 'processing', message, error: '', details: null }));
  }, []);

  const setSuccess = useCallback((output, message = 'Done. Your file is ready.') => {
    setJob((prev) => {
      if (prev.output && prev.output !== output) {
        revokeOutput(prev.output);
      }

      return {
        state: 'success',
        message,
        output,
        error: '',
        details: null,
      };
    });
  }, []);

  const setError = useCallback((error, details = null) => {
    setJob((prev) => ({
      ...prev,
      state: 'error',
      error: typeof error === 'string' ? error : error?.message || 'Something went wrong.',
      message: 'Could not complete this request.',
      details,
    }));
  }, []);

  const reset = useCallback((message = initialMessage) => {
    setJob((prev) => {
      if (prev.output) {
        revokeOutput(prev.output);
      }

      return {
        state: 'idle',
        message,
        output: null,
        error: '',
        details: null,
      };
    });
  }, [initialMessage]);

  useEffect(() => {
    outputRef.current = job.output;
  }, [job.output]);

  useEffect(
    () => () => {
      if (outputRef.current) {
        revokeOutput(outputRef.current);
      }
    },
    [],
  );

  const isBusy = useMemo(() => job.state === 'uploading' || job.state === 'processing', [job.state]);

  return {
    ...job,
    isBusy,
    setReady,
    setUploading,
    setProcessing,
    setSuccess,
    setError,
    reset,
  };
}
