import type { Locale } from "./messages";

export type AppRoute = "home" | "map" | "documents" | "stats";

const LOCALE_STORAGE_KEY = "askktu.locale";

export function getDefaultLocale(): Locale {
  if (typeof window === "undefined") return "lt";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "lt") return stored;
  } catch {
    /* ignore */
  }
  const nav = navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("en")) return "en";
  if (nav.startsWith("lt")) return "lt";
  return "lt";
}

export function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

function segmentToRoute(seg: string): AppRoute {
  const s = seg.toLowerCase();
  if (!s || s === "home" || s === "faq") return "home";
  if (s === "map") return "map";
  if (s === "documents" || s === "docs") return "documents";
  if (s === "stats") return "stats";
  return "home";
}

/**
 * Supports legacy hashes (`#documents`) and locale-prefixed (`#/lt/documents`).
 */
export function parseHash(hash: string): { locale: Locale | null; route: AppRoute } {
  const raw = (hash || "").replace(/^#\/?/, "").trim().toLowerCase();
  if (!raw) return { locale: null, route: "home" };
  const parts = raw.split("/").filter(Boolean);
  let i = 0;
  let locale: Locale | null = null;
  if (parts[0] === "en" || parts[0] === "lt") {
    locale = parts[0];
    i = 1;
  }
  const routeSeg = parts[i] ?? "home";
  return { locale, route: segmentToRoute(routeSeg) };
}

export function buildHash(locale: Locale, route: AppRoute): string {
  const seg = route === "home" ? "home" : route;
  return `#/${locale}/${seg}`;
}

/** Raw path segment after locale (e.g. `faq`, `documents`) for nav highlighting. */
export function pathAfterLocale(hash: string): string {
  const raw = (hash || "").replace(/^#\/?/, "").trim().toLowerCase();
  if (!raw) return "home";
  const parts = raw.split("/").filter(Boolean);
  const i = parts[0] === "en" || parts[0] === "lt" ? 1 : 0;
  return parts[i] ?? "home";
}

export function buildHashRaw(locale: Locale, segment: string): string {
  return `#/${locale}/${segment}`;
}
