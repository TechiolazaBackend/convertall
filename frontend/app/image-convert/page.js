import ToolPageLayout from '../components/ToolPageLayout';
import ImageConvertTool from '../components/tool-forms/ImageConvertTool';
import { getToolById } from '../lib/toolConfig';

export default function ImageConvertPage() {
  const tool = getToolById('image-convert');

  return (
    <ToolPageLayout tool={tool}>
      <ImageConvertTool tool={{ accept: tool.accept, maxSizeMB: tool.maxSizeMB }} />
    </ToolPageLayout>
  );
}
