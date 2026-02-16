import { LockKeyhole, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';

import RevealBlock from './RevealBlock';

const TRUST_ITEMS = [
  { icon: Trash2, label: 'Auto file cleanup' },
  { icon: Sparkles, label: 'No watermark' },
  { icon: ShieldCheck, label: 'Secure backend processing' },
  { icon: LockKeyhole, label: 'Large file support' },
];

export default function TrustStripSection() {
  return (
    <RevealBlock className="story-section trust-section">
      <div className="trust-strip" aria-label="Trust features">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <span key={item.label} className="trust-pill">
              <Icon size={14} />
              {item.label}
            </span>
          );
        })}
      </div>
    </RevealBlock>
  );
}
