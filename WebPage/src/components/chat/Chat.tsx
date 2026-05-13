import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { normalizeCitations, type NormalizedCitation } from "./normalizeCitations";
import { extractCitationsFromAnswer } from "./extractCitationsFromAnswer";
import { localizeCitationParagraphLabel, localizeCitationTitle } from "./localizeCitation";
import { useLocale } from "../../i18n/LocaleContext";

export type { NormalizedCitation };

const API_URL = import.meta.env.VITE_API_URL ?? "";
const MarkdownCodeHighlighter = SyntaxHighlighter as unknown as ComponentType<Record<string, unknown>>;

type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
  /** RAG / retrieval sources for assistant replies (optional until API returns them). */
  citations?: NormalizedCitation[];
  confidence?: number;
  meta?: {
    kind?: "error";
    retryUserText?: string;
  };
}

export interface ChatProps {
  /** Active session; when null, input is disabled until user creates or selects a chat. */
  sessionId: string | null;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}

function formatMessageTime(ms: number, localeTag: string): string {
  const d = new Date(ms);
  return d.toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" });
}

function getLatestAssistantCitations(messages: ChatMessage[]): NormalizedCitation[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.meta?.kind !== "error") {
      return m.citations ?? [];
    }
  }
  return [];
}

const TITLE_TRUNCATE = 50;

function createMarkdownComponents(): Components {
  return {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className ?? "");
      const code = String(children).replace(/\n$/, "");
      const isCodeBlock = Boolean(match?.[1]) || code.includes("\n");
      if (isCodeBlock) {
        return (
          <MarkdownCodeHighlighter
            style={oneLight}
            language={match?.[1] ?? "text"}
            PreTag="div"
            className="chat-markdown-codeblock"
            {...props}
          >
            {code}
          </MarkdownCodeHighlighter>
        );
      }
      return (
        <code className={`chat-markdown-inline-code ${className ?? ""}`} {...props}>
          {children}
        </code>
      );
    },
    a({ ...props }) {
      return <a {...props} target="_blank" rel="noopener noreferrer" />;
    },
  };
}

type ChatWidgetTab = "chat" | "sources";

export default function Chat({
  sessionId,
  messages,
  onMessagesChange,
}: ChatProps) {
  const { t, locale } = useLocale();
  const dateLocaleTag = locale === "lt" ? "lt-LT" : "en-GB";
  const markdownComponents = useMemo(() => createMarkdownComponents(), []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [activeTab, setActiveTab] = useState<ChatWidgetTab>("chat");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const latestSources = useMemo(
    () => getLatestAssistantCitations(messages),
    [messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setInput("");
    setActiveTab("chat");
  }, [sessionId]);

  useEffect(() => {
    if (sessionId !== null && !isLoading) {
      inputRef.current?.focus();
    }
  }, [sessionId, isLoading]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    // Immediate UI update; fetch will reject shortly after.
    setIsLoading(false);
  };

  const sendMessage = async (
    userText: string,
    baseMessages: ChatMessage[],
    { appendUserBubble }: { appendUserBubble: boolean },
  ) => {
    if (isLoading || sessionId === null) return;

    const now = Date.now();
    const idAtSend = sessionId;

    const afterUser = appendUserBubble
      ? (() => {
          const userMessage: ChatMessage = {
            id: `user-${now}`,
            role: "user",
            text: userText,
            timestamp: now,
          };
          const next = [...baseMessages, userMessage];
          onMessagesChange(next);
          return next;
        })()
      : baseMessages;

    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = afterUser.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const endpoint = API_URL ? `${API_URL}/api/chat/stream` : "/api/chat/stream";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ message: userText, conversation_history: history }),
      });
      if (!res.ok) {
        let rateLimitMessage = "";
        if (res.status === 429) {
          try {
            const maybeJson = (await res.json()) as { response?: string; detail?: string };
            rateLimitMessage = maybeJson.response ?? maybeJson.detail ?? "";
          } catch {
            rateLimitMessage = (await res.text()).trim();
          }
        }
        throw new Error(
          res.status === 429
            ? rateLimitMessage || t("chat.rateLimit")
            : t("chat.requestFailed", { status: res.status }),
        );
      }
      if (!res.body) {
        throw new Error(t("chat.streamBodyMissing"));
      }
      if (controller.signal.aborted) return;
      if (sessionIdRef.current !== idAtSend) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const botMessageId = `assistant-${Date.now()}`;
      let streamedText = "";
      let sourceCitations: NormalizedCitation[] = [];
      let streamConfidence: number | undefined;
      let sourcesHeaderParsed = false;
      const baseTimestamp = Date.now();

      // Add placeholder assistant bubble and then append stream chunks in-place.
      onMessagesChange([
        ...afterUser,
        { id: botMessageId, role: "assistant", text: "", timestamp: baseTimestamp },
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) {
          await reader.cancel().catch(() => {});
          return;
        }
        if (sessionIdRef.current !== idAtSend) {
          await reader.cancel().catch(() => {});
          return;
        }

        const chunkText = decoder.decode(value, { stream: true });
        if (!chunkText) continue;
        streamedText += chunkText;

        // Parse sources + confidence header line sent by backend before text stream
        if (!sourcesHeaderParsed && streamedText.includes("\n")) {
          const newlineIdx = streamedText.indexOf("\n");
          const firstLine = streamedText.slice(0, newlineIdx);
          try {
            const parsed = JSON.parse(firstLine) as { __sources__?: unknown; __confidence__?: number };
            if (parsed.__sources__) {
              sourceCitations = normalizeCitations(parsed.__sources__);
              if (typeof parsed.__confidence__ === "number") {
                streamConfidence = parsed.__confidence__;
              }
              streamedText = streamedText.slice(newlineIdx + 1);
              sourcesHeaderParsed = true;
            }
          } catch {
            sourcesHeaderParsed = true;
          }
        }

        onMessagesChange([
          ...afterUser,
          {
            id: botMessageId,
            role: "assistant",
            text: streamedText,
            timestamp: baseTimestamp,
            ...(sourceCitations.length > 0 ? { citations: sourceCitations } : {}),
            ...(streamConfidence !== undefined ? { confidence: streamConfidence } : {}),
          },
        ]);
      }

      streamedText += decoder.decode();
      const finalCitations = sourceCitations.length > 0
        ? sourceCitations
        : extractCitationsFromAnswer(streamedText);

      onMessagesChange([
        ...afterUser,
        {
          id: botMessageId,
          role: "assistant",
          text: streamedText || t("chat.noResponse"),
          timestamp: baseTimestamp,
          ...(finalCitations.length > 0 ? { citations: finalCitations } : {}),
          ...(streamConfidence !== undefined ? { confidence: streamConfidence } : {}),
        },
      ]);
    } catch (err) {
      // If the user cancels, don't show an error bubble.
      if (
        err instanceof DOMException &&
        (err.name === "AbortError" || err.message === "The operation was aborted.")
      ) {
        return;
      }
      if (sessionIdRef.current !== idAtSend) return;
      const errMessage =
        err instanceof Error && err.message ? err.message : t("chat.networkError");
      const errorMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: errMessage,
        timestamp: Date.now(),
        meta: { kind: "error", retryUserText: userText },
      };
      onMessagesChange([...afterUser, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      // Clear only after submit completes so the field stays readable while loading.
      setInput("");
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    await sendMessage(trimmed, messages, { appendUserBubble: true });
  };

  const handleRetry = async (errorMessageId: string) => {
    if (isLoading || sessionId === null) return;
    const idx = messages.findIndex((m) => m.id === errorMessageId);
    const errorMsg = idx >= 0 ? messages[idx] : undefined;
    const retryUserText = errorMsg?.meta?.retryUserText;
    if (!retryUserText) return;

    // Keep the conversation "in context": retry using messages up to (but excluding) the error bubble.
    const baseMessages = messages.slice(0, idx);
    onMessagesChange(baseMessages);
    await sendMessage(retryUserText, baseMessages, { appendUserBubble: false });
  };

  const sendFeedback = async (messageId: string, rating: "up" | "down", answer: string, messagesSnapshot: ChatMessage[]) => {
    if (feedback[messageId]) return;
    setFeedback((prev) => ({ ...prev, [messageId]: rating }));
    const idx = messagesSnapshot.findIndex((m) => m.id === messageId);
    const question = idx > 0 ? messagesSnapshot[idx - 1].text : "";
    const endpoint = API_URL ? `${API_URL}/api/feedback` : "/api/feedback";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, rating }),
    }).catch(() => {});
  };

  const downloadChat = () => {
    const lines = messages.map((m) => {
      const time = new Date(m.timestamp).toLocaleString();
      const role = m.role === "user" ? "You" : "askKTU Chatbot";
      return `[${time}] ${role}:\n${m.text}`;
    });
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `askktu-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadChatAsPdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = margin;

    const addPage = () => {
      doc.addPage();
      y = margin;
    };

    const checkY = (needed: number) => {
      if (y + needed > doc.internal.pageSize.getHeight() - margin) addPage();
    };

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("askKTU Chat Export", margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    const sessionDate = new Date(messages[0]?.timestamp ?? Date.now()).toLocaleDateString(
      locale === "lt" ? "lt-LT" : "en-GB",
      { year: "numeric", month: "long", day: "numeric" },
    );
    doc.text(`Session: ${sessionDate}`, margin, y);
    y += 5;

    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setTextColor(0);

    for (const m of messages) {
      const isUser = m.role === "user";
      const role = isUser ? "You" : "askKTU Bot";
      const time = new Date(m.timestamp).toLocaleTimeString(
        locale === "lt" ? "lt-LT" : "en-GB",
        { hour: "2-digit", minute: "2-digit" },
      );

      checkY(10);

      // Role + time line
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isUser ? 30 : 0, isUser ? 100 : 120, isUser ? 200 : 160);
      doc.text(`${role}  ·  ${time}`, margin, y);
      y += 5;
      doc.setTextColor(0);

      // Message body
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(m.text, contentW);
      for (const line of lines) {
        checkY(5);
        doc.text(line as string, margin, y);
        y += 5;
      }
      y += 3;
    }

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text("Generated by askKTU · askktu.online", margin, doc.internal.pageSize.getHeight() - 8);

    doc.save(`askktu-chat-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.meta?.kind !== "error") return m.id;
    }
    return null;
  }, [messages]);

  const handleTabsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActiveTab("sources");
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActiveTab("chat");
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveTab("chat");
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveTab("sources");
    }
  };

  return (
    <section className="chat" aria-label={t("chat.ariaLabel")} aria-busy={isLoading}>
      <header className="chat-header">
        <div className="chat-header-main">
          <div
            className="chat-header-avatar"
            role="img"
            aria-label={t("chat.botAvatar")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z" />
            </svg>
          </div>
          <div className="chat-header-text">
            <div className="chat-header-name">{t("chat.botName")}</div>
            <div className="chat-header-status">
              <span
                className={
                  "chat-header-status-dot " +
                  (isOnline
                    ? "chat-header-status-dot--online"
                    : "chat-header-status-dot--offline")
                }
                aria-hidden="true"
              />
              <span className="chat-header-status-label">
                {isOnline ? t("chat.online") : t("chat.offline")}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="chat-download-btn"
          onClick={downloadChat}
          disabled={messages.length === 0}
          aria-label="Download chat as TXT"
          title="Download as TXT"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span style={{ fontSize: 10, lineHeight: 1 }}>TXT</span>
        </button>
        <button
          type="button"
          className="chat-download-btn"
          onClick={downloadChatAsPdf}
          disabled={messages.length === 0}
          aria-label="Download chat as PDF"
          title="Download as PDF"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span style={{ fontSize: 10, lineHeight: 1 }}>PDF</span>
        </button>
      </header>

      <div className="chat-body">
        <div
          className="chat-tabs"
          role="tablist"
          aria-label={t("chat.tablistAria")}
          onKeyDown={handleTabsKeyDown}
        >
          <button
            type="button"
            className="chat-tab"
            role="tab"
            id="chat-tab-chat"
            aria-selected={activeTab === "chat"}
            aria-controls="chat-tabpanel-chat"
            tabIndex={activeTab === "chat" ? 0 : -1}
            onClick={() => setActiveTab("chat")}
          >
            {t("chat.tabChat")}
          </button>
          <button
            type="button"
            className="chat-tab"
            role="tab"
            id="chat-tab-sources"
            aria-selected={activeTab === "sources"}
            aria-controls="chat-tabpanel-sources"
            tabIndex={activeTab === "sources" ? 0 : -1}
            onClick={() => setActiveTab("sources")}
          >
            {t("chat.tabSources")}
          </button>
        </div>

        <div
          id="chat-tabpanel-chat"
          className="chat-tabpanel-chat"
          role="tabpanel"
          aria-labelledby="chat-tab-chat"
          hidden={activeTab !== "chat"}
        >
          <div
            ref={listRef}
            className="chat-messages"
            role="log"
            aria-label={t("chat.messagesAria")}
            aria-live="polite"
            tabIndex={0}
          >
        {messages.length === 0 && !isLoading && sessionId !== null && (
          <div className="chat-suggestions" aria-live="polite">
            <p className="chat-suggestions-hint">Try asking:</p>
            {[
              "What are the scholarship requirements at KTU?",
              "How do I apply for a dormitory?",
              "What are the academic rules for retaking exams?",
            ].map((q) => (
              <button
                key={q}
                type="button"
                className="chat-suggestion-btn"
                onClick={() => sendMessage(q, messages, { appendUserBubble: true })}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.length === 0 && !isLoading && sessionId === null && (
          <p className="chat-messages-empty" aria-live="polite">
            {t("chat.emptyNoSession")}
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message chat-message--${message.role}`}
          >
            {message.role === "assistant" && (
              <div
                className="chat-message-avatar chat-message-avatar--assistant"
                role="img"
                aria-label={t("chat.botAvatar")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z" />
                </svg>
              </div>
            )}
            <div className="chat-message-body">
              {message.role === "assistant" && (
                <div className="chat-message-name">{t("chat.botName")}</div>
              )}
              <div
                className={
                  "chat-message-text" +
                  (message.meta?.kind === "error" ? " chat-message-text--error" : "")
                }
              >
                {message.meta?.kind === "error" && (
                  <span className="chat-error-icon" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v5" />
                      <path d="M12 16h.01" />
                    </svg>
                  </span>
                )}
                {message.meta?.kind === "error" ? (
                  <span>{message.text}</span>
                ) : (
                  <div className="chat-markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      skipHtml
                      components={markdownComponents}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {message.meta?.kind === "error" && (
                <div className="chat-error-actions">
                  <button
                    type="button"
                    className="chat-retry"
                    onClick={() => handleRetry(message.id)}
                    disabled={isLoading}
                  >
                    {t("chat.retry")}
                  </button>
                </div>
              )}
              {message.role === "assistant" && message.meta?.kind !== "error" && message.confidence !== undefined && (
                <div
                  className={`chat-confidence chat-confidence--${
                    message.confidence >= 70 ? "high" : message.confidence >= 40 ? "mid" : "low"
                  }`}
                  title={`Confidence score: ${message.confidence}%`}
                >
                  <span className="chat-confidence-bar" style={{ width: `${message.confidence}%` }} />
                  <span className="chat-confidence-label">{message.confidence}%</span>
                </div>
              )}
              <time
                className="chat-message-time"
                dateTime={new Date(message.timestamp).toISOString()}
              >
                {formatMessageTime(message.timestamp, dateLocaleTag)}
              </time>
              {message.role === "assistant" && message.meta?.kind !== "error" && (
                <div className="chat-feedback">
                  <button
                    type="button"
                    className={`chat-feedback-btn${feedback[message.id] === "up" ? " chat-feedback-btn--selected" : ""}`}
                    disabled={!!feedback[message.id]}
                    aria-label={t("chat.feedbackHelpful")}
                    onClick={() => sendFeedback(message.id, "up", message.text, messages)}
                  >👍</button>
                  <button
                    type="button"
                    className={`chat-feedback-btn${feedback[message.id] === "down" ? " chat-feedback-btn--selected" : ""}`}
                    disabled={!!feedback[message.id]}
                    aria-label={t("chat.feedbackNotHelpful")}
                    onClick={() => sendFeedback(message.id, "down", message.text, messages)}
                  >👎</button>
                </div>
              )}
            </div>
            {message.role === "user" && (
              <div
                className="chat-message-avatar chat-message-avatar--user"
                role="img"
                aria-label={t("chat.userAvatar")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message-body">
              <div className="chat-message-name">{t("chat.botName")}</div>
              <div className="chat-message-text">{t("chat.thinking")}</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>

        <div
          id="chat-tabpanel-sources"
          className="chat-sources-panel"
          role="tabpanel"
          aria-labelledby="chat-tab-sources"
          hidden={activeTab !== "sources"}
        >
          <p key={lastAssistantId ?? "none"} className="visually-hidden" aria-live="polite">
            {latestSources.length === 0
              ? t("chat.sourcesEmptySr")
              : t("chat.sourcesUpdatedSr", { count: latestSources.length })}
          </p>
          {latestSources.length === 0 ? (
            <p className="chat-sources-empty" role="status">
              {t("chat.sourcesEmpty")}
            </p>
          ) : (
            <ul className="chat-sources-list" aria-label={t("chat.sourcesListAria")}>
              {latestSources.map((c, i) => {
                const titleFull = localizeCitationTitle(c.documentTitle, t);
                const paraDisplay = localizeCitationParagraphLabel(c.paragraphLabel, t);
                const titleTrunc =
                  titleFull.length > TITLE_TRUNCATE
                    ? `${titleFull.slice(0, TITLE_TRUNCATE)}…`
                    : titleFull;
                const titleId = `chat-source-title-${i}`;
                return (
                  <li key={`${c.documentTitle}-${c.paragraphLabel}-${i}`} className="chat-sources-item">
                    <div className="chat-source-block" aria-labelledby={titleId}>
                      <h3
                        id={titleId}
                        className="chat-source-doc-title"
                        title={titleFull.length >= TITLE_TRUNCATE ? titleFull : undefined}
                      >
                        {titleTrunc}
                      </h3>
                      <p className="chat-source-para-ref">{paraDisplay}</p>
                      {c.snippet ? (
                        <p className="chat-source-snippet">{c.snippet}</p>
                      ) : null}
                      <div className="chat-source-link-row">
                        {c.url && !c.linkInvalid ? (
                          <a
                            className="chat-source-link"
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("chat.openDocument")}
                          </a>
                        ) : c.linkInvalid ? (
                          <span className="chat-source-link-broken">
                            <span className="chat-source-warn-icon" aria-hidden="true">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                            </span>
                            <span>{t("chat.linkUnavailable")}</span>
                            <span className="visually-hidden">{t("chat.linkInvalidSr")}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="ask">
        <label htmlFor="chat-input" className="visually-hidden">
          {t("chat.inputLabel")}
        </label>
        <input
          ref={inputRef}
          id="chat-input"
          type="text"
          className="input"
          placeholder={t("chat.inputPlaceholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // On mobile, give the keyboard time to open then scroll input into view.
            setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 320);
          }}
          disabled={isLoading || sessionId === null}
          aria-label={t("chat.inputLabel")}
        />
        {isLoading && (
          <button
            type="button"
            className="chat-stop"
            onClick={handleStop}
            aria-label={t("chat.stopAria")}
            title={t("chat.stopTitle")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="7" y="7" width="10" height="10" rx="2" ry="2" />
              <path d="M9.5 9.5L14.5 14.5" />
              <path d="M14.5 9.5L9.5 14.5" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="chat-send"
          onClick={handleSend}
          disabled={!input.trim() || isLoading || sessionId === null}
          aria-label={t("chat.sendAria")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </section>
  );
}
