export interface ChatSession {
  id: string;
  title: string;
  /** Unix ms for display + `datetime` on `<time>` */
  timestamp: number;
}

export interface ChatHistoryProps {
  sessions: ChatSession[];
  /** Which session is open in the main chat (drives list highlight). */
  activeSessionId?: string | null;
  /** Called when the user selects a session (navigation wired later). */
  onSelectSession?: (sessionId: string) => void;
  /** Called when the user starts a new chat (parent adds a session, resets chat, etc.). */
  onCreateNewChat?: () => void;
}

function formatSessionTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatHistory({
  sessions,
  activeSessionId = null,
  onSelectSession,
  onCreateNewChat,
}: ChatHistoryProps) {
  const hasSessions = sessions.length > 0;

  return (
    <aside className="chat-history" aria-label="Chat sessions">
      <button
        type="button"
        className="btn chat-history-new"
        onClick={() => onCreateNewChat?.()}
      >
        Create new chat
      </button>
      <h3 className="chat-history-title">Chats</h3>
      <div className="chat-history-body">
        {!hasSessions ? (
          <p className="chat-history-empty" role="status">
            No chat history yet
          </p>
        ) : (
          <ul className="chat-history-list">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
              <li key={session.id}>
                <button
                  type="button"
                  className={
                    "chat-history-item" +
                    (isActive ? " chat-history-item--active" : "")
                  }
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSelectSession?.(session.id)}
                >
                  <span className="chat-history-item-title">{session.title}</span>
                  <time
                    className="chat-history-item-time"
                    dateTime={new Date(session.timestamp).toISOString()}
                  >
                    {formatSessionTime(session.timestamp)}
                  </time>
                </button>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
