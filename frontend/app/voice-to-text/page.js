import ToolPageLayout from '../components/ToolPageLayout';
import VoiceToTextTool from '../components/tool-forms/VoiceToTextTool';
import { getToolById } from '../lib/toolConfig';

export default function VoiceToTextPage() {
  const tool = getToolById('voice-to-text');

  return (
    <ToolPageLayout tool={tool}>
      <VoiceToTextTool tool={{ accept: tool.accept, maxSizeMB: tool.maxSizeMB }} />
    </ToolPageLayout>
  );
}
