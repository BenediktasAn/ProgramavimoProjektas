import { useEffect, useState } from "react";
import { EXTERNAL_LINKS } from "../../../config";

function normalizeHash(hash: string): string {
  // Examples:
  // - "#documents" -> "documents"
  // - "#/documents" -> "documents"
  return hash.replace(/^#\/?/, "").toLowerCase();
}

export function TopNav() {
  const [currentHash, setCurrentHash] = useState(() =>
    typeof window === "undefined" ? "" : normalizeHash(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = () => setCurrentHash(normalizeHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const isCurrent = (value: string | string[]) =>
    (Array.isArray(value) ? value : [value]).some((v) => v === currentHash);

  return (
    <nav className="nav" aria-label="Primary">
      <a href="#home" aria-current={isCurrent("home") ? "page" : undefined}>
        Home
      </a>
      <a
        href="#documents"
        aria-current={isCurrent(["documents", "docs"]) ? "page" : undefined}
      >
        Documents
      </a>
      <a href="#map" aria-current={isCurrent("map") ? "page" : undefined}>
        MAP
      </a>
      <a href="#faq" aria-current={isCurrent("faq") ? "page" : undefined}>
        FAQ
      </a>
      <a href={EXTERNAL_LINKS.ais} target="_blank" rel="noreferrer">
        AIS
      </a>
      <a href={EXTERNAL_LINKS.moodle} target="_blank" rel="noreferrer">
        Moodle
      </a>
    </nav>
  );
}
