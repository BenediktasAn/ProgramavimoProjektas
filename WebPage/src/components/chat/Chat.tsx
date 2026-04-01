import { useEffect, useRef, useState } from "react";

const CHATBOT_NAME = "askKTU Chatbot";
const API_URL = import.meta.env.VITE_API_URL ?? "";

type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: number;
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


export default function Chat({
  sessionId,
  messages,
  onMessagesChange,
}: ChatProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setInput("");
  }, [sessionId]);

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
      const data = (await res.json()) as { response?: string };
      if (controller.signal.aborted) return;
      if (sessionIdRef.current !== idAtSend) return;
      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.response ?? "(No response text from server.)",
        timestamp: Date.now(),
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
                <span>{message.text}</span>
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

      <div className="ask">
        <label htmlFor="chat-input" className="visually-hidden">
          Message to chatbot
        </label>
        <input
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
