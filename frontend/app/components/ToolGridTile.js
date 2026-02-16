import Link from 'next/link';

export default function ToolGridTile({ tool }) {
  const Icon = tool.icon;

  return (
    <Link href={tool.href} className="tool-tile" aria-label={`Open ${tool.title}`}>
      <span className="tile-blob" aria-hidden="true" />
      <span className="tile-code" aria-hidden="true">
        {tool.short}
      </span>
      <span className="tile-icon-wrap" aria-hidden="true">
        <Icon size={30} strokeWidth={2.2} />
      </span>
      <h3>{tool.title}</h3>
      <p>{tool.description}</p>
    </Link>
  );
}
