import { Suspense, lazy, useEffect, useState } from "react";
import HomePage from "./pages/Home/HomePage";
import DocumentPage from "./pages/Document/DocumentPage";
import StatsPage from "./pages/Stats/StatsPage";
import LoginPage from "./pages/Home/LoginPage";

const MapPage = lazy(() => import("./pages/Home/MapPage"));

type Route = "home" | "map" | "documents" | "stats";

function normalizeHash(hash: string): string {
  // Examples:
  // - "#documents" -> "documents"
  // - "#/documents" -> "documents"
  return hash.replace(/^#\/?/, "").toLowerCase();
}

function routeFromHash(hash: string): Route {
  const h = normalizeHash(hash);
  if (!h || h === "home") return "home";
  if (h === "map") return "map";
  if (h === "documents" || h === "docs") return "documents";
  if (h === "stats") return "stats";
  // Unknown hash: keep the app stable by falling back to home.
  return "home";
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined" ? "home" : routeFromHash(window.location.hash),
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
      () => localStorage.getItem("isAuthenticated") === "true"
  ); // To log out: localStorage.removeItem("isAuthenticated");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    // Prevent "scroll jump" to non-existing anchor IDs; ensure a stable layout.
    window.scrollTo(0, 0);
  }, [route]);

  const onToggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (route === "map") {
    return (
      <Suspense fallback={<div className="container">Loading MAP...</div>}>
        <MapPage theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    );
  }

  if (route === "documents") {
    return <DocumentPage />;
  }

  if (route === "stats") {
    return <StatsPage />;
  }

  return <HomePage theme={theme} onToggleTheme={onToggleTheme} />;
}

