import Link from 'next/link';

export default function ToolPageLayout({ tool, children }) {
  const Icon = tool.icon;

  return (
    <main className="page-shell tool-page">
      <div className="background-orb orb-a" />
      <div className="background-orb orb-b" />

      <div className="back-link-row">
        <Link href="/" className="back-link">
          Back to tools
        </Link>
      </div>

      <section className="tool-main-card">
        <header className="tool-page-header">
          <span className="tool-page-icon" aria-hidden="true">
            <Icon size={30} strokeWidth={2.2} />
          </span>
          <div>
            <h1>{tool.title}</h1>
            <p>{tool.description}</p>
          </div>
        </header>

        <div className="trust-row" aria-label="Trust badges">
          <span>Fast</span>
          <span>Private</span>
          <span>No signup</span>
          {tool.id === 'voice-to-text' || tool.id === 'text-to-voice' ? <span>Offline processing</span> : null}
        </div>

        {children}
      </section>
    </main>
  );
}
