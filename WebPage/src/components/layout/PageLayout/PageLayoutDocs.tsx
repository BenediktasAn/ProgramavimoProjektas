import type { ReactNode } from "react";
import { useLocale } from "../../../i18n/LocaleContext";

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
  const { t } = useLocale();
  return (
    <>
      {/* Accessibility: skip to main */}
      <a className="skip-link" href="#main">{t("layout.skipToMain")}</a>

      {/* App bar */}
      <div className="appbar">
        <div className="container appbar-inner">
          {header}
          {topNav /* placed inside the bar to align with your .nav styles */}
        </div>
      </div>

      {/* Main section – uses your hero + hero-layout */}
      <main id="main" className="container container--full" aria-label={t("layout.mainAria")} style={{ paddingTop: 24, paddingBottom: 24 }}>
        <section className="docs-section">
          <div>
            {/* Left column (320px on desktop per CSS) */}
            <div aria-label={t("layout.leftAria")}>
              {leftColumn}
            </div>

            {/* Right (1fr) main content */}
            <div aria-label={t("layout.primaryAria")}>
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