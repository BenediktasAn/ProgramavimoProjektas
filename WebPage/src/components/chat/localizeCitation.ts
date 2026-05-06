import type { MessageKey } from "../../i18n/messages";
import { CITATION_FALLBACK_REF, CITATION_FALLBACK_TITLE } from "./normalizeCitations";

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function localizeCitationTitle(title: string, t: Translate): string {
  if (title === CITATION_FALLBACK_TITLE) return t("chat.citationUntitled");
  return title;
}

export function localizeCitationParagraphLabel(label: string, t: Translate): string {
  if (label === CITATION_FALLBACK_REF) return t("chat.citationRefParagraph");
  const para = /^Paragraph (\d+)$/.exec(label);
  if (para) return t("chat.citationParagraph", { n: para[1] });
  const page = /^Page (\d+)$/.exec(label);
  if (page) return t("chat.citationPage", { n: page[1] });
  const pages = /^Page\(s\) (.+)$/.exec(label);
  if (pages) return t("chat.citationPageList", { detail: pages[1].trim() });
  return label;
}
