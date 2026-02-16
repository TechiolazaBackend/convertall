import { FileAudio2, FileText, ImagePlus, NotebookPen } from 'lucide-react';

import RevealBlock from './RevealBlock';

const CASES = [
  {
    icon: NotebookPen,
    title: 'Lecture PDF → Notes',
    copy: 'Convert class handouts into editable DOCX.',
  },
  {
    icon: FileText,
    title: 'Meeting audio → Text',
    copy: 'Transcribe calls for searchable summaries.',
  },
  {
    icon: ImagePlus,
    title: 'Assignment photos → PDF',
    copy: 'Merge mobile snapshots into one file.',
  },
  {
    icon: FileAudio2,
    title: 'YouTube → MP3',
    copy: 'Extract audio for offline listening.',
  },
];

export default function UseCasesSection() {
  return (
    <RevealBlock className="story-section usecases-section">
      <div className="story-head">
        <h2>Popular workflows</h2>
        <p>Real tasks people finish in seconds.</p>
      </div>

      <div className="usecase-row" aria-label="Example use cases">
        {CASES.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="usecase-card">
              <span className="usecase-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          );
        })}
      </div>
    </RevealBlock>
  );
}
