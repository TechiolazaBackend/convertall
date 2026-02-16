import ToolPageLayout from '../components/ToolPageLayout';
import ImageToPdfTool from '../components/tool-forms/ImageToPdfTool';
import { getToolById } from '../lib/toolConfig';

export default function ImageToPdfPage() {
  const tool = getToolById('image-to-pdf');

  return (
    <ToolPageLayout tool={tool}>
      <ImageToPdfTool tool={{ accept: tool.accept, maxFiles: tool.maxFiles, maxSizeMB: tool.maxSizeMB }} />
    </ToolPageLayout>
  );
}
