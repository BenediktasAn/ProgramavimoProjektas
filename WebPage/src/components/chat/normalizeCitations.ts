/**
 * Normalizes mixed backend citation shapes into a stable display model.
 */

export interface NormalizedCitation {
  documentTitle: string;
  paragraphLabel: string;
  snippet?: string;
  /** Resolved URL for navigation; omitted when no link was provided. */
  url?: string;
  /** True when a URL was present but invalid / unsafe to open. */
  linkInvalid?: boolean;
}

/** Canonical English fallbacks — localized in UI via `localizeCitation*`. */
export const CITATION_FALLBACK_TITLE = "Untitled Document";
export const CITATION_FALLBACK_REF = "Referenced paragraph";

const UNTITLED = CITATION_FALLBACK_TITLE;
const REF_PARA = CITATION_FALLBACK_REF;
const SNIPPET_MAX = 180;

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function truncateSnippet(text: string): string {
  const t = text.trim();
  if (t.length <= SNIPPET_MAX) return t;
  return t.slice(0, SNIPPET_MAX).trimEnd() + "…";
}

function buildParagraphLabel(o: Record<string, unknown>): string {
  const explicit = pickString(o, [
    "paragraph_label",
    "paragraphLabel",
    "paragraph_ref",
    "paragraphRef",
    "reference_label",
  ]);
  if (explicit) return explicit;

  const p = pickNumber(o, ["paragraph", "paragraph_number", "paragraph_index", "para"]);
  if (p !== undefined) return `Paragraph ${p}`;

  const anchor = pickString(o, ["anchor", "fragment", "hash"]);
  if (anchor) return anchor.length > 120 ? anchor.slice(0, 117) + "…" : anchor;

  const chunk = pickString(o, ["chunk_id", "chunkId", "chunk"]);
  if (chunk) {
    const tail = chunk.match(/(\d+)$/);
    if (tail) return `Paragraph ${tail[1]}`;
    return REF_PARA;
  }

  const page = pickNumber(o, ["page", "page_number", "pageNumber"]);
  if (page !== undefined) return `Page ${page}`;

  return REF_PARA;
}

function resolveUrl(raw: string | undefined): { url?: string; linkInvalid?: boolean } {
  if (!raw || !String(raw).trim()) return {};
  const t = String(raw).trim();
  try {
    const base =
      typeof window !== "undefined" && window.location?.href
        ? window.location.href
        : "http://localhost/";
    const u = t.includes("://") ? new URL(t) : new URL(t, base);
    if (u.protocol === "javascript:" || u.protocol === "data:" || u.protocol === "vbscript:") {
      return { linkInvalid: true };
    }
    return { url: u.href };
  } catch {
    return { linkInvalid: true };
  }
}

function scoreEntry(o: Record<string, unknown>): number {
  const s = pickNumber(o, ["relevance", "relevance_score", "score", "similarity"]);
  if (s !== undefined) return s;
  const r = pickNumber(o, ["rank"]);
  if (r !== undefined) return -r;
  return 0;
}

function normalizeOne(entry: unknown): NormalizedCitation | null {
  if (!entry || typeof entry !== "object") return null;
  const o = entry as Record<string, unknown>;

  const title =
    pickString(o, [
      "title",
      "document_title",
      "documentTitle",
      "name",
      "document_name",
      "documentName",
    ]) ?? "";
  const documentTitle = title.trim() ? title.trim() : UNTITLED;

  const snippetRaw = pickString(o, ["snippet", "text", "excerpt", "content", "chunk_text", "chunkText"]);
  const snippet = snippetRaw ? truncateSnippet(snippetRaw) : undefined;

  const hrefRaw = pickString(o, ["url", "link", "href", "document_url", "documentUrl", "uri"]);
  let url: string | undefined;
  let linkInvalid: boolean | undefined;
  if (hrefRaw?.trim()) {
    const resolved = resolveUrl(hrefRaw);
    if (resolved.linkInvalid) linkInvalid = true;
    else if (resolved.url) url = resolved.url;
  }

  return {
    documentTitle,
    paragraphLabel: buildParagraphLabel(o),
    ...(snippet ? { snippet } : {}),
    ...(url ? { url } : {}),
    ...(linkInvalid ? { linkInvalid: true } : {}),
  };
}

/**
 * Accepts an array or single object; unknown shapes are skipped.
 * Entries are sorted by relevance score (descending) when scores exist.
 */
export function normalizeCitations(raw: unknown): NormalizedCitation[] {
  if (raw == null) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const scored = arr
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const o = entry as Record<string, unknown>;
      return { entry, index, score: scoreEntry(o) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const hasScores = scored.some((s) => s.score !== 0);
  if (hasScores) {
    scored.sort((a, b) => b.score - a.score || a.index - b.index);
  }

  const out: NormalizedCitation[] = [];
  for (const { entry } of scored) {
    const n = normalizeOne(entry);
    if (n) out.push(n);
  }
  return out;
}
