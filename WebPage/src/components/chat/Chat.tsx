import { useState } from "react";

const CHATBOT_NAME = "askKTU Chatbot";

export default function Chat() {
  const [input, setInput] = useState("");
  const [isOnline] = useState(true);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Later task will handle sending and displaying messages.
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="chat" aria-label="Chat">
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
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message to chatbot"
        />
        <button
          type="button"
          className="chat-send"
          onClick={handleSend}
          disabled={!input.trim()}
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
