import type { ReactNode } from "react";
import { useLocale } from "../../../i18n/LocaleContext";

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
  const { t } = useLocale();
  return (
    <>
      {/* Accessibility: skip to main */}
      <a className="skip-link" href="#main">{t("layout.skipToMain")}</a>

      {/* Header and TopNav */}
      <div
        className="appbar"
        style={{
          position: "relative",
          zIndex: 1000,
        }}
      >
        <div className="container appbar-inner">
          {header}
          {topNav}
        </div>
      </div>

      {/* Main section */}
      <main id="main" className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <section className="hero">
          <div
            className="hero-layout"
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "stretch",
            }}
          >
            {/* Left sidebar */}
            {leftColumn && (
              <div
                style={{
                  width: "320px",
                  height: "500px", // 🔥 svarbu – fiksuotas aukštis
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  boxSizing: "border-box",
                  background: "#fff",
                  overflowY: "auto", // 🔥 scroll vietoj tempimo
                }}
              >
                {leftColumn}
              </div>
            )}
            {/* Right main content */}
            <div
              style={{
                flex: 1,
                height: "500px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
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