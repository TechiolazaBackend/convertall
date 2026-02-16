import ToolPageLayout from '../components/ToolPageLayout';
import TextToVoiceTool from '../components/tool-forms/TextToVoiceTool';
import { getToolById } from '../lib/toolConfig';

export default function TextToVoicePage() {
  const tool = getToolById('text-to-voice');

  return (
    <ToolPageLayout tool={tool}>
      <TextToVoiceTool tool={{ accept: tool.accept, maxSizeMB: tool.maxSizeMB }} />
    </ToolPageLayout>
  );
}
