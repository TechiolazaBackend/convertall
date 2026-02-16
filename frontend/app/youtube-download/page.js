import ToolPageLayout from '../components/ToolPageLayout';
import YoutubeDownloadTool from '../components/tool-forms/YoutubeDownloadTool';
import { getToolById } from '../lib/toolConfig';

export default function YoutubeDownloadPage() {
  const tool = getToolById('youtube-download');

  return (
    <ToolPageLayout tool={tool}>
      <YoutubeDownloadTool />
    </ToolPageLayout>
  );
}
