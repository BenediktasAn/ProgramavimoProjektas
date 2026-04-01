import { useCallback, useState } from "react";
import PageLayout from "../../components/layout/PageLayout/PageLayout";
import Header from "../../components/layout/Header/Header";
import { TopNav } from "../../components/layout/TopNav/TopNav";
import RightPanel from "../../components/layout/RightPanel/RightPanel";
import Footer from "../../components/layout/Footer/Footer";
import Chat, { type ChatMessage } from "../../components/chat/Chat";
import ChatHistory, { type ChatSession } from "../../components/chat/ChatHistory";
import logoSrc from "../../assets/logo.png";


export interface HomePageProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function HomePage({ theme, onToggleTheme }: HomePageProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messagesBySession, setMessagesBySession] = useState<
    Record<string, ChatMessage[]>
  >({});

  const handleCreateNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newSession: ChatSession = {
      id,
      title: "New chat",
      timestamp: now,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    setMessagesBySession((prev) => ({ ...prev, [id]: [] }));
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleMessagesChange = useCallback(
    (next: ChatMessage[]) => {
      if (!activeSessionId) return;
      setMessagesBySession((prev) => ({
        ...prev,
        [activeSessionId]: next,
      }));
    },
    [activeSessionId],
  );

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
        />
      }
      rightMain={
        <>
          <Chat
            sessionId={activeSessionId}
            messages={
              activeSessionId
                ? (messagesBySession[activeSessionId] ?? [])
                : []
            }
            onMessagesChange={handleMessagesChange}
          />
		
          <RightPanel /> 
        </>
      }
      footer={<Footer />}
    />
  );
}
