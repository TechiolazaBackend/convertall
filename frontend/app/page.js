import HowItWorksSection from './components/home/HowItWorksSection';
import RecentActivitySection from './components/home/RecentActivitySection';
import TrustStripSection from './components/home/TrustStripSection';
import UseCasesSection from './components/home/UseCasesSection';
import ToolGridTile from './components/ToolGridTile';
import { TOOL_ITEMS } from './lib/toolConfig';

export default function HomePage() {
  return (
    <main className="page-shell home-page">
      {/* Aurora background */}
      <div className="background-orb orb-a" />
      <div className="background-orb orb-b" />
      <div className="background-orb orb-c" />
      <div className="grid-overlay" aria-hidden="true" />

      <section className="intro-shell">
        <section className="hero-card">
          <div className="hero-inner">
            <p className="eyebrow">Technolaza Converter Suite</p>
            <h1>Drop a file. Pick a format. Download in seconds.</h1>
            <p className="hero-copy">Image, PDF, audio, speech, and YouTube tools in one clean workspace.</p>
          </div>
        </section>

        <section className="tools-section" aria-label="Conversion tools">
          <div className="section-head">
            <h2>Tools at your fingertips</h2>
            <p>Open a focused workspace for each conversion.</p>
          </div>

          <div className="tool-grid">
            {TOOL_ITEMS.map((tool) => (
              <ToolGridTile key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <p className="scroll-cue" aria-hidden="true">
          Scroll to explore
        </p>
      </section>

      <HowItWorksSection />
      <UseCasesSection />
      <TrustStripSection />
      <RecentActivitySection />
    </main>
  );
}
