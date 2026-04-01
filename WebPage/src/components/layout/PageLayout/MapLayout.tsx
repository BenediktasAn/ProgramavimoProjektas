import type { ReactNode } from "react";

export interface MapLayoutProps {
  header: ReactNode;
  topNav?: ReactNode;
  leftColumn?: ReactNode;
  rightMain: ReactNode;
  footer?: ReactNode;
}

export default function MapLayout({
  header,
  topNav,
  leftColumn,
  rightMain,
  footer
}: MapLayoutProps) {
  return (
    <>
      {/* Accessibility: skip to main */}
      <a className="skip-link" href="#main">Skip to main content</a>

      {/* Header and TopNav */}
      <div className="appbar">
        <div className="container appbar-inner">
          {header}
          {topNav}
        </div>
      </div>

      {/* Main section */}
      <main id="main" className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <section className="hero">
          <div className="hero-layout" style={{ display: "flex", gap: 0 }}>
            {/* Left sidebar */}
            {leftColumn && (
              <div
                style={{
                  width: "320px",
                  padding: "20px",
                  borderRight: "1px solid #ddd",
                  boxSizing: "border-box",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                {leftColumn}
              </div>
            )}

            {/* Right main content */}
            <div style={{ flex: 1, height: "500px" }}>
              {rightMain}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      {footer && <footer className="container">{footer}</footer>}
    </>
  );
}