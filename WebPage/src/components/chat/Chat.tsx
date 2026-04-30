import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { normalizeCitations } from "./normalizeCitations";
import type { NormalizedCitation } from "./normalizeCitations";
import { extractCitationsFromAnswer } from "./extractCitationsFromAnswer";

export type { NormalizedCitation };

const CHATBOT_NAME = "askKTU Chatbot";
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

function formatMessageTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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
const markdownComponents: Components = {
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


type ChatWidgetTab = "chat" | "sources";

export default function Chat({
  sessionId,
  messages,
  onMessagesChange,
}: ChatProps) {
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
      const endpoint = API_URL ? `${API_URL}/api/chat` : "/api/chat";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ message: userText, conversation_history: history }),
      });
      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.status}`);
      }
      const data = (await res.json()) as {
        response?: string;
        citations?: unknown;
        sources?: unknown;
        references?: unknown;
        source_documents?: unknown;
        retrieved_chunks?: unknown;
      };
      if (controller.signal.aborted) return;
      if (sessionIdRef.current !== idAtSend) return;
      const rawCitations =
        data.citations ??
        data.sources ??
        data.references ??
        data.source_documents ??
        data.retrieved_chunks;
      const normalized = normalizeCitations(rawCitations);
      const fallbackCitations =
        normalized.length > 0
          ? normalized
          : extractCitationsFromAnswer(data.response ?? "");
      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.response ?? "(No response text from server.)",
        timestamp: Date.now(),
        ...(fallbackCitations.length > 0 ? { citations: fallbackCitations } : {}),
      };
      onMessagesChange([...afterUser, botMessage]);
    } catch (err) {
      // If the user cancels, don't show an error bubble.
      if (
        err instanceof DOMException &&
        (err.name === "AbortError" || err.message === "The operation was aborted.")
      ) {
        return;
      }
      if (sessionIdRef.current !== idAtSend) return;
      const errorMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: "Sorry, I couldn't reach the server. Please try again.",
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
    <section className="chat" aria-label="Chat" aria-busy={isLoading}>
      <header className="chat-header">
        <div className="chat-header-main">
          <div
            className="chat-header-avatar"
            role="img"
            aria-label="Chatbot avatar"
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
            <div className="chat-header-name">{CHATBOT_NAME}</div>
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
                {isOnline ? "Online & Ready" : "Offline & Unavailable"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="chat-body">
        <div
          className="chat-tabs"
          role="tablist"
          aria-label="Chat widget sections"
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
            Chat
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
            Sources
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
            aria-label="Chat message list"
            aria-live="polite"
            tabIndex={0}
          >
        {messages.length === 0 && !isLoading && (
          <p className="chat-messages-empty" aria-live="polite">
            {sessionId === null
              ? "Create a new chat or pick one from the list to get started."
              : "Start a conversation"}
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
                aria-label="Chatbot avatar"
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
                <div className="chat-message-name">{CHATBOT_NAME}</div>
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
                    Retry
                  </button>
                </div>
              )}
              <time
                className="chat-message-time"
                dateTime={new Date(message.timestamp).toISOString()}
              >
                {formatMessageTime(message.timestamp)}
              </time>
              {message.role === "assistant" && message.meta?.kind !== "error" && (
                <div className="chat-feedback">
                  <button
                    type="button"
                    className={`chat-feedback-btn${feedback[message.id] === "up" ? " chat-feedback-btn--selected" : ""}`}
                    disabled={!!feedback[message.id]}
                    aria-label="Helpful"
                    onClick={() => sendFeedback(message.id, "up", message.text, messages)}
                  >👍</button>
                  <button
                    type="button"
                    className={`chat-feedback-btn${feedback[message.id] === "down" ? " chat-feedback-btn--selected" : ""}`}
                    disabled={!!feedback[message.id]}
                    aria-label="Not helpful"
                    onClick={() => sendFeedback(message.id, "down", message.text, messages)}
                  >👎</button>
                </div>
              )}
            </div>
            {message.role === "user" && (
              <div
                className="chat-message-avatar chat-message-avatar--user"
                role="img"
                aria-label="User avatar"
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
              <div className="chat-message-name">{CHATBOT_NAME}</div>
              <div className="chat-message-text">Thinking...</div>
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
              ? "No sources used for this response."
              : `Sources list updated: ${latestSources.length} reference${latestSources.length === 1 ? "" : "s"}.`}
          </p>
          {latestSources.length === 0 ? (
            <p className="chat-sources-empty" role="status">
              No sources used for this response.
            </p>
          ) : (
            <ul className="chat-sources-list" aria-label="Document references for the latest reply">
              {latestSources.map((c, i) => {
                const titleFull = c.documentTitle;
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
                      <p className="chat-source-para-ref">{c.paragraphLabel}</p>
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
                            Open document
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
                            <span>Link unavailable</span>
                            <span className="visually-hidden">. Invalid or broken link.</span>
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
          Message to chatbot
        </label>
        <input
          ref={inputRef}
          id="chat-input"
          type="text"
          className="input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || sessionId === null}
          aria-label="Message to chatbot"
        />
        {isLoading && (
          <button
            type="button"
            className="chat-stop"
            onClick={handleStop}
            aria-label="Stop generating"
            title="Stop generating"
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
          aria-label="Send message"
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
