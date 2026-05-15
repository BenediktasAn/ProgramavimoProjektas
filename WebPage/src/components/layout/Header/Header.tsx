import { useLocale } from "../../../i18n/LocaleContext";

export interface HeaderProps {
  title?: string;                       // fallback if no logo
  logo?: { src: string; alt: string };  // pass your image here
  onToggleSidebar?: () => void;
  onToggleTheme?: () => void;
  theme?: "light" | "dark";
}

function IconMoon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export default function Header({
  title = "askKTU",
  logo,
  onToggleTheme,
  theme = "light",
}: HeaderProps) {
  const { t } = useLocale();

  return (
    <div className="header-brand">
      {logo ? (
        <a href="/" className="header-logo-link" aria-label={title}>
          <img
            src={logo.src}
            alt={logo.alt}
            className="header-logo-img"
          />
        </a>
      ) : (
        <h1 className="header-title-fallback">{title}</h1>
      )}
      {onToggleTheme ? (
        <button
          type="button"
          className="header-theme-toggle"
          onClick={onToggleTheme}
          aria-label={
            theme === "light" ? t("theme.switchToDark") : t("theme.switchToLight")
          }
          aria-pressed={theme === "dark"}
        >
          {theme === "light" ? <IconMoon /> : <IconSun />}
        </button>
      ) : null}
    </div>
  );
}
