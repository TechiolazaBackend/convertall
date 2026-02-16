import ToolPageLayout from '../components/ToolPageLayout';
import PdfToWordTool from '../components/tool-forms/PdfToWordTool';
import { getToolById } from '../lib/toolConfig';

export default function PdfToWordPage() {
  const tool = getToolById('pdf-to-word');

  return (
    <ToolPageLayout tool={tool}>
      <PdfToWordTool tool={{ accept: tool.accept, maxSizeMB: tool.maxSizeMB }} />
    </ToolPageLayout>
  );
}
