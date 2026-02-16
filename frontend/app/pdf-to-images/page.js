import ToolPageLayout from '../components/ToolPageLayout';
import PdfToImagesTool from '../components/tool-forms/PdfToImagesTool';
import { getToolById } from '../lib/toolConfig';

export default function PdfToImagesPage() {
  const tool = getToolById('pdf-to-images');

  return (
    <ToolPageLayout tool={tool}>
      <PdfToImagesTool tool={{ accept: tool.accept, maxSizeMB: tool.maxSizeMB }} />
    </ToolPageLayout>
  );
}
