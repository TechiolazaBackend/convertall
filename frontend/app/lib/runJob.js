export async function runJob({ job, uploadText, processText, task, onSuccess }) {
  try {
    job.setUploading(uploadText || 'Uploading...');
    await new Promise((resolve) => setTimeout(resolve, 160));
    job.setProcessing(processText || 'Processing...');

    const output = await task();
    job.setSuccess(output, 'Done. Download is ready.');

    if (typeof onSuccess === 'function') {
      onSuccess(output);
    }
  } catch (error) {
    job.setError(error?.message || 'Something went wrong.', error?.details || null);
  }
}
