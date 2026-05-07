import { useEffect, useState } from "react";
import { EXTERNAL_LINKS } from "../../../config";
import { useLocale } from "../../../i18n/LocaleContext";
import {
  buildHash,
  buildHashRaw,
  parseHash,
  pathAfterLocale,
  type AppRoute,
} from "../../../i18n/hashRouting";

export function TopNav() {
  const { locale, setLocale, t } = useLocale();
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === "undefined" ? "home" : parseHash(window.location.hash).route,
  );
  const [pathSeg, setPathSeg] = useState(() =>
    typeof window === "undefined" ? "home" : pathAfterLocale(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash).route);
      setPathSeg(pathAfterLocale(window.location.hash));
    };
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const href = (r: AppRoute) => buildHash(locale, r);

  const isCurrent = (value: string | string[]) => {
    const keys = Array.isArray(value) ? value : [value];
    return keys.some((v) => {
      if (v === "home") return pathSeg === "home" && route === "home";
      if (v === "faq") return pathSeg === "faq";
      return v === route || (v === "docs" && route === "documents");
    });
  };

  return (
    <nav className="nav" aria-label={t("nav.primaryAria")}>
      <div className="nav-links">
        <a href={href("home")} aria-current={isCurrent("home") ? "page" : undefined}>
          {t("nav.home")}
        </a>
        <a
          href={href("documents")}
          aria-current={isCurrent(["documents", "docs"]) ? "page" : undefined}
        >
          {t("nav.documents")}
        </a>
        <a href={href("map")} aria-current={isCurrent("map") ? "page" : undefined}>
          {t("nav.map")}
        </a>
        <a href={href("stats")} aria-current={isCurrent("stats") ? "page" : undefined}>
          {t("nav.stats")}
        </a>
        <a href={buildHashRaw(locale, "faq")} aria-current={isCurrent("faq") ? "page" : undefined}>
          {t("nav.faq")}
        </a>
        <a href={EXTERNAL_LINKS.ais} target="_blank" rel="noreferrer">
          AIS
        </a>
        <a href={EXTERNAL_LINKS.moodle} target="_blank" rel="noreferrer">
          Moodle
        </a>
      </div>
      <div className="nav-lang" role="group" aria-label={t("nav.language")}>
        <button
          type="button"
          className={"nav-lang-btn" + (locale === "en" ? " nav-lang-btn--active" : "")}
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
          aria-label={t("nav.langEn")}
        >
          EN
        </button>
        <span className="nav-lang-sep" aria-hidden="true">
          |
        </span>
        <button
          type="button"
          className={"nav-lang-btn" + (locale === "lt" ? " nav-lang-btn--active" : "")}
          onClick={() => setLocale("lt")}
          aria-pressed={locale === "lt"}
          aria-label={t("nav.langLt")}
        >
          LT
        </button>
      </div>
    </nav>
  );
}
