import { ArrowRight, Download, Settings2, Upload } from 'lucide-react';

import RevealBlock from './RevealBlock';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload',
    copy: 'Drop your file',
  },
  {
    icon: Settings2,
    title: 'Process',
    copy: 'Secure conversion',
  },
  {
    icon: Download,
    title: 'Download',
    copy: 'Get result instantly',
  },
];

export default function HowItWorksSection() {
  return (
    <RevealBlock className="story-section how-section">
      <div className="story-head">
        <h2>How it works</h2>
        <p>Three quick steps, no learning curve.</p>
      </div>

      <div className="how-flow" aria-label="Conversion flow">
        {STEPS.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.title} className="how-step">
              <span className="how-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>

              {index < STEPS.length - 1 ? (
                <span className="flow-arrow" aria-hidden="true">
                  <ArrowRight size={14} />
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </RevealBlock>
  );
}
