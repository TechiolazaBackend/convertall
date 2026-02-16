'use client';

import { History, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { loadRecentActivity, subscribeRecentActivity } from '../../lib/recentActivity';
import RevealBlock from './RevealBlock';

const DEMO_ITEMS = [
  { id: 'demo-1', toolName: 'PDF to Word', outputName: 'lecture-notes.docx', timestamp: new Date().toISOString() },
  { id: 'demo-2', toolName: 'Voice to Text', outputName: 'meeting-transcript.txt', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 'demo-3', toolName: 'PNG ↔ JPG', outputName: 'banner.jpg', timestamp: new Date(Date.now() - 172800000).toISOString() },
];

function formatTime(isoDate) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return 'Just now';
  }
}

export default function RecentActivitySection() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(loadRecentActivity());
    return subscribeRecentActivity(setItems);
  }, []);

  const list = items.length > 0 ? items : DEMO_ITEMS;

  return (
    <RevealBlock className="story-section activity-section">
      <div className="story-head">
        <h2>Recent activity</h2>
        <p>{items.length > 0 ? 'Live from this browser session.' : 'Sample timeline preview.'}</p>
      </div>

      <div className="activity-list" aria-label="Recent conversions">
        {list.map((item) => (
          <article key={item.id} className="activity-item">
            <span className="activity-icon" aria-hidden="true">
              {items.length > 0 ? <History size={14} /> : <Sparkles size={14} />}
            </span>

            <div className="activity-text">
              <p>
                <strong>{item.toolName}</strong>
              </p>
              <p>{item.outputName}</p>
            </div>

            <time dateTime={item.timestamp}>{formatTime(item.timestamp)}</time>
          </article>
        ))}
      </div>
    </RevealBlock>
  );
}
