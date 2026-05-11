import { Suspense, lazy, useCallback, useEffect, useState, type ReactNode } from "react";
import HomePage from "./pages/Home/HomePage";
import DocumentPage from "./pages/Document/DocumentPage";
import StatsPage from "./pages/Stats/StatsPage";
import AdminPage from "./pages/Admin/AdminPage";
import LoginPage from "./pages/Home/LoginPage";
import { LocaleProvider, useLocale } from "./i18n/LocaleContext";
import {
  buildHash,
  getDefaultLocale,
  parseHash,
  persistLocale,
  type AppRoute,
} from "./i18n/hashRouting";
import type { Locale } from "./i18n/messages";

const MapPage = lazy(() => import("./pages/Home/MapPage"));

function MapRouteFallback() {
  const { t } = useLocale();
  return (
    <div className="container" style={{ padding: "24px 0" }}>
      {t("map.loading")}
    </div>
  );
}

function AuthenticatedRoutes({
  route,
  theme,
  onToggleTheme,
}: {
  route: AppRoute;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  if (route === "map") {
    return (
      <Suspense fallback={<MapRouteFallback />}>
        <MapPage theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    );
  }

  if (route === "documents") {
    return <DocumentPage theme={theme} onToggleTheme={onToggleTheme} />;
  }

  if (route === "stats") {
    return <StatsPage theme={theme} onToggleTheme={onToggleTheme} />;
  }

  if (route === "admin") {
    return <AdminPage theme={theme} onToggleTheme={onToggleTheme} />;
  }

  return <HomePage theme={theme} onToggleTheme={onToggleTheme} />;
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === "undefined" ? "home" : parseHash(window.location.hash).route,
  );
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window === "undefined"
      ? "lt"
      : (parseHash(window.location.hash).locale ?? getDefaultLocale()),
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("isAuthenticated") === "true",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(theme === "light" ? "theme-light" : "theme-dark");
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale === "lt" ? "lt" : "en";
  }, [locale]);

  useEffect(() => {
    const syncFromHash = () => {
      const p = parseHash(window.location.hash);
      setRoute(p.route);
      if (p.locale) {
        setLocaleState(p.locale);
        persistLocale(p.locale);
      }
    };

    if (typeof window !== "undefined") {
      const initial = parseHash(window.location.hash);
      if (!initial.locale) {
        const loc = getDefaultLocale();
        window.history.replaceState(null, "", buildHash(loc, initial.route));
        setLocaleState(loc);
        setRoute(initial.route);
        persistLocale(loc);
      } else {
        setRoute(initial.route);
        setLocaleState(initial.locale);
        persistLocale(initial.locale);
      }
    }

    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const onToggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const setLocale = useCallback(
    (next: Locale) => {
      persistLocale(next);
      setLocaleState(next);
      window.location.hash = buildHash(next, route);
    },
    [route],
  );

  const shell = (node: ReactNode) => (
    <LocaleProvider locale={locale} setLocale={setLocale}>
      {node}
    </LocaleProvider>
  );

  if (!isAuthenticated) {
    return shell(<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />);
  }

  return shell(<AuthenticatedRoutes route={route} theme={theme} onToggleTheme={onToggleTheme} />);
}
