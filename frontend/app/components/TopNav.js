'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { checkBackendHealth } from '../lib/apiClient';

export default function TopNav() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;

    async function refreshStatus() {
      const healthy = await checkBackendHealth();
      if (mounted) {
        setStatus(healthy ? 'connected' : 'offline');
      }
    }

    refreshStatus();
    const timer = setInterval(refreshStatus, 20000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link href="/" className="logo-link" aria-label="Technolaza home">
          <span className="logo-mark">TZ</span>
          <span className="logo-text">Technolaza</span>
        </Link>

        <nav className="top-nav-links" aria-label="Main navigation">
          <Link href="/" className="nav-link">
            Tools
          </Link>
          <span className={`backend-chip ${status}`}>
            <span className="dot" aria-hidden="true" />
            {status === 'checking' ? 'Checking backend' : status === 'connected' ? 'Backend connected' : 'Backend offline'}
          </span>
        </nav>
      </div>
    </header>
  );
}
