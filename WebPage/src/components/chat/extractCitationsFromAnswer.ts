import type { NormalizedCitation } from "./normalizeCitations";
import { CITATION_FALLBACK_TITLE, CITATION_FALLBACK_REF } from "./normalizeCitations";

/**
 * Fallback parser for citation-like mentions inside assistant text when backend
 * does not return structured citations yet.
 */
export function extractCitationsFromAnswer(answer: string): NormalizedCitation[] {
  const text = (answer ?? "").trim();
  if (!text) return [];

  const out: NormalizedCitation[] = [];
  const seen = new Set<string>();

  // Pattern: "Document Name.pdf" (Page 2) or (Pages 2, 4)
  const filePattern =
    /["“]?([A-Za-z0-9][A-Za-z0-9 _\-\u00C0-\u024F().,&]{4,}?\.(?:pdf|docx?|xlsx?|pptx?))["”]?\s*\((Pages?|Puslap(?:is|iai))\s*([^)]+)\)/gi;
  for (const m of text.matchAll(filePattern)) {
    const doc = (m[1] ?? "").trim();
    const pagesRaw = (m[3] ?? "").trim();
    if (!doc) continue;
    const key = `${doc}|${pagesRaw}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      documentTitle: doc || CITATION_FALLBACK_TITLE,
      paragraphLabel: pagesRaw ? `Page(s) ${pagesRaw}` : CITATION_FALLBACK_REF,
    });
  }

  // Pattern: [Source: xxx, Page: y]
  const sourcePattern =
    /\[Source:\s*([^,\]]+?)\s*,\s*Page:\s*([^\]]+?)\]/gi;
  for (const m of text.matchAll(sourcePattern)) {
    const doc = (m[1] ?? "").trim();
    const page = (m[2] ?? "").trim();
    if (!doc) continue;
    const key = `${doc}|${page}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      documentTitle: doc || CITATION_FALLBACK_TITLE,
      paragraphLabel: page ? `Page ${page}` : CITATION_FALLBACK_REF,
    });
  }

  // Pattern: Source: Document Name
  const sourceLinePattern =
    /(?:^|\n)\s*(?:Source|Šaltinis)\s*:\s*([^\n.]{4,160})/gi;
  for (const m of text.matchAll(sourceLinePattern)) {
    const doc = (m[1] ?? "").trim().replace(/[;,.]\s*$/, "");
    if (!doc) continue;
    const key = `${doc}|default`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      documentTitle: doc || CITATION_FALLBACK_TITLE,
      paragraphLabel: CITATION_FALLBACK_REF,
    });
  }

  return out;
}
