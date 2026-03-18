import type { ReactNode } from "react";

export interface PageLayoutProps {
  header: ReactNode;
  topNav?: ReactNode;
  leftColumn?: ReactNode;     // e.g., chat history / navigation
  rightMain: ReactNode;       // main content (chat area)
  footer?: ReactNode;
}

export default function PageLayoutDocs({
  header,
  topNav,
  leftColumn,
  rightMain,
  footer
}: PageLayoutProps) {
  return (
    <>
      {/* Accessibility: skip to main */}
      <a className="skip-link" href="#main">Skip to main content</a>

      {/* App bar */}
      <div className="appbar">
        <div className="container appbar-inner">
          {header}
          {topNav /* placed inside the bar to align with your .nav styles */}
        </div>
      </div>

      {/* Main section – uses your hero + hero-layout */}
      <main id="main" className="container" aria-label="Main content" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <section className="hero">
          <div>
            {/* Left column (320px on desktop per CSS) */}
            <div aria-label="Left column">
              {leftColumn}
            </div>

            {/* Right (1fr) main content */}
            <div aria-label="Primary content">
              {rightMain}
            </div>
          </div>
        </section>
      </main>

      {/* Footer (your CSS already styles footer tag) */}
      {footer && <footer className="container">{footer}</footer>}
    </>
  );
}