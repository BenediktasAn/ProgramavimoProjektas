import { useCallback, useEffect, useRef, useState } from "react";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import Header from "../../components/layout/Header/Header";
import { TopNav } from "../../components/layout/TopNav/TopNav";
import Footer from "../../components/layout/Footer/Footer";
import Chat, { type ChatMessage } from "../../components/chat/Chat";
import ChatHistory, { type ChatSession } from "../../components/chat/ChatHistory";
import logoSrc from "../../assets/logo.png";
import { useLocale } from "../../i18n/LocaleContext";

const SESSIONS_STORAGE_KEY = "askktu.chat.sessions";
const MESSAGES_STORAGE_KEY = "askktu.chat.messagesBySession";
const ACTIVE_SESSION_STORAGE_KEY = "askktu.chat.activeSessionId";

function sortSessionsByMostRecent(sessions: ChatSession[]): ChatSession[] {
  return [...sessions].sort((a, b) => b.timestamp - a.timestamp);
}

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}


export interface HomePageProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function HomePage({ theme, onToggleTheme }: HomePageProps) {
  const { t } = useLocale();
  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    sortSessionsByMostRecent(readLocalStorage<ChatSession[]>(SESSIONS_STORAGE_KEY, [])),
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    readLocalStorage<string | null>(ACTIVE_SESSION_STORAGE_KEY, null),
  );
  const didAutoStartForEmptyStateRef = useRef(false);
  const [messagesBySession, setMessagesBySession] = useState<
    Record<string, ChatMessage[]>
  >(() => readLocalStorage<Record<string, ChatMessage[]>>(MESSAGES_STORAGE_KEY, {}));

  const handleCreateNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    const now = Date.now();
    setSessions((prev) => {
      const baseTitle = t("home.newChatTitle");
      const normalizedTitles = new Set(
        prev.map((session) => session.title.trim().toLocaleLowerCase()),
      );
      let title = baseTitle;
      if (normalizedTitles.has(baseTitle.toLocaleLowerCase())) {
        let suffix = 2;
        while (normalizedTitles.has(`${baseTitle} ${suffix}`.toLocaleLowerCase())) {
          suffix += 1;
        }
        title = `${baseTitle} ${suffix}`;
      }
      const newSession: ChatSession = {
        id,
        title,
        timestamp: now,
      };
      return sortSessionsByMostRecent([newSession, ...prev]);
    });
    setActiveSessionId(id);
    setMessagesBySession((prev) => ({ ...prev, [id]: [] }));
  }, [t]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleRenameSession = useCallback(
    async (sessionId: string, nextTitle: string) => {
      setSessions((prev) =>
        sortSessionsByMostRecent(
          prev.map((session) =>
            session.id === sessionId ? { ...session, title: nextTitle } : session,
          ),
        ),
      );
    },
    [],
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId);
        setActiveSessionId((prevActive) =>
          prevActive === sessionId ? (next[0]?.id ?? null) : prevActive,
        );
        return next;
      });
      setMessagesBySession((prev) => {
        const { [sessionId]: _removed, ...rest } = prev;
        return rest;
      });
    },
    [],
  );

  const handleDeleteAllSessions = useCallback(async () => {
    setSessions([]);
    setMessagesBySession({});
    setActiveSessionId(null);
  }, []);

  const handleMessagesChange = useCallback(
    (next: ChatMessage[]) => {
      if (!activeSessionId) return;
      setMessagesBySession((prev) => ({
        ...prev,
        [activeSessionId]: next,
      }));
      const latest = next[next.length - 1];
      const snippet = latest?.text?.trim() ?? "";
      const now = Date.now();
      setSessions((prev) =>
        sortSessionsByMostRecent(
          prev.map((session) =>
            session.id === activeSessionId
              ? {
                  ...session,
                  timestamp: now,
                  snippet: snippet ? snippet.slice(0, 90) : undefined,
                }
              : session,
          ),
        ),
      );
    },
    [activeSessionId],
  );

  useEffect(() => {
    if (sessions.length === 0 && activeSessionId === null) {
      if (didAutoStartForEmptyStateRef.current) return;
      didAutoStartForEmptyStateRef.current = true;
      handleCreateNewChat();
      return;
    }
    didAutoStartForEmptyStateRef.current = false;
  }, [sessions.length, activeSessionId, handleCreateNewChat]);

  useEffect(() => {
    if (sessions.length === 0) return;
    const activeStillExists = Boolean(
      activeSessionId && sessions.some((session) => session.id === activeSessionId),
    );
    if (!activeStillExists) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messagesBySession));
  }, [messagesBySession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      ACTIVE_SESSION_STORAGE_KEY,
      JSON.stringify(activeSessionId),
    );
  }, [activeSessionId]);

  return (
    <PageLayout
      header={
        <Header
          // title="askKTU"           ⟵ remove/ignore the text title
          logo={{ src: logoSrc, alt: "askKTU logo" }}
          onToggleTheme={onToggleTheme}
          theme={theme}
        />
      }
      topNav={<TopNav />}
      leftColumn={
        <ChatHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          onCreateNewChat={handleCreateNewChat}
          onSelectSession={handleSelectSession}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onDeleteAllSessions={handleDeleteAllSessions}
        />
      }
      rightMain={
        <Chat
          sessionId={activeSessionId}
          messages={
            activeSessionId
              ? (messagesBySession[activeSessionId] ?? [])
              : []
          }
          onMessagesChange={handleMessagesChange}
        />
      }
      footer={<Footer />}
    />
  );
}
