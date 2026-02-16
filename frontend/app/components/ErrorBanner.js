'use client';

export default function ErrorBanner({ error, details, onRetry }) {
  if (!error) {
    return null;
  }

  return (
    <div className="error-banner" role="alert">
      <p>{error}</p>
      <div className="error-actions">
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Retry
        </button>
        {details ? (
          <details>
            <summary>Details</summary>
            <pre>{JSON.stringify(details, null, 2)}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
