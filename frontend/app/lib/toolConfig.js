import {
  FileAudio,
  FileImage,
  FileText,
  Images,
  Mic,
  RefreshCw,
  Youtube,
} from 'lucide-react';

export const TOOL_ITEMS = [
  {
    id: 'image-to-pdf',
    href: '/image-to-pdf',
    title: 'Image to PDF',
    short: 'IP',
    description: 'Merge JPG/PNG into a clean PDF.',
    icon: Images,
    accept: ['image/png', 'image/jpeg'],
    maxFiles: 20,
    maxSizeMB: 100,
  },
  {
    id: 'pdf-to-images',
    href: '/pdf-to-images',
    title: 'PDF to Images',
    short: 'PI',
    description: 'Export PDF pages as PNG or JPG.',
    icon: FileImage,
    accept: ['application/pdf', '.pdf'],
    maxFiles: 1,
    maxSizeMB: 100,
  },
  {
    id: 'pdf-to-word',
    href: '/pdf-to-word',
    title: 'PDF to Word',
    short: 'PW',
    description: 'Convert PDF into editable DOCX.',
    icon: FileText,
    accept: ['application/pdf', '.pdf'],
    maxFiles: 1,
    maxSizeMB: 100,
  },
  {
    id: 'image-convert',
    href: '/image-convert',
    title: 'PNG ↔ JPG',
    short: 'IJ',
    description: 'Convert image format in one click.',
    icon: RefreshCw,
    accept: ['image/png', 'image/jpeg'],
    maxFiles: 1,
    maxSizeMB: 100,
  },
  {
    id: 'voice-to-text',
    href: '/voice-to-text',
    title: 'Voice to Text',
    short: 'VT',
    description: 'Transcribe audio to text/docs.',
    icon: Mic,
    accept: ['audio/*'],
    maxFiles: 1,
    maxSizeMB: 100,
  },
  {
    id: 'text-to-voice',
    href: '/text-to-voice',
    title: 'Text to Voice',
    short: 'TV',
    description: 'Turn text or docs into speech.',
    icon: FileAudio,
    accept: ['.txt', '.pdf', '.docx', 'text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFiles: 1,
    maxSizeMB: 100,
  },
  {
    id: 'youtube-download',
    href: '/youtube-download',
    title: 'YouTube Download',
    short: 'YT',
    description: 'Fetch MP4 video or MP3 audio.',
    icon: Youtube,
    maxFiles: 0,
    maxSizeMB: 0,
  },
];

export const TOOL_MAP = Object.fromEntries(TOOL_ITEMS.map((item) => [item.id, item]));

export function getToolById(id) {
  return TOOL_MAP[id] || null;
}
