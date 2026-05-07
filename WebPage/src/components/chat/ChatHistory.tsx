import { useEffect, useMemo, useState } from "react";
import { useLocale } from "../../i18n/LocaleContext";

export interface ChatSession {
  id: string;
  title: string;
  /** Unix ms for display + `datetime` on `<time>` */
  timestamp: number;
  /** Optional preview of the latest message in the session. */
  snippet?: string;
}

const MAX_CHAT_TITLE_LENGTH = 60;

export interface ChatHistoryProps {
  sessions: ChatSession[];
  /** Which session is open in the main chat (drives list highlight). */
  activeSessionId?: string | null;
  /** Called when the user selects a session (navigation wired later). */
  onSelectSession?: (sessionId: string) => void;
  /** Called when the user starts a new chat (parent adds a session, resets chat, etc.). */
  onCreateNewChat?: () => void;
  /**
   * Called when the user renames a chat.
   * Throw/reject to report a save failure; the UI will keep edit mode and show retry feedback.
   */
  onRenameSession?: (sessionId: string, title: string) => void | Promise<void>;
  /**
   * Called when the user deletes a chat.
   * Throw/reject to report a failure; the UI will show retry feedback.
   */
  onDeleteSession?: (sessionId: string) => void | Promise<void>;
  /**
   * Called when user confirms deletion of all chats.
   * Throw/reject to report a failure.
   */
  onDeleteAllSessions?: () => void | Promise<void>;
}

function formatSessionTime(ms: number, localeTag: string): string {
  const d = new Date(ms);
  return d.toLocaleTimeString(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatSessionDate(ms: number, localeTag: string): string {
  const d = new Date(ms);
  return d.toLocaleDateString(localeTag, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toLocalDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toMinutesSinceMidnight(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
}

function parseTimeToMinutes(value: string): number | null {
  if (!value) return null;
  const [hh, mm] = value.split(":").map(Number);
  if (
    Number.isNaN(hh) ||
    Number.isNaN(mm) ||
    hh < 0 ||
    hh > 23 ||
    mm < 0 ||
    mm > 59
  ) {
    return null;
  }
  return hh * 60 + mm;
}

export default function ChatHistory({
  sessions,
  activeSessionId = null,
  onSelectSession,
  onCreateNewChat,
  onRenameSession,
  onDeleteSession,
  onDeleteAllSessions,
}: ChatHistoryProps) {
  const { t, locale } = useLocale();
  const dateLocaleTag = locale === "lt" ? "lt-LT" : "en-GB";
  const hasSessions = sessions.length > 0;
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteErrorSessionId, setDeleteErrorSessionId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const editingSession = useMemo(
    () => sessions.find((s) => s.id === editingSessionId) ?? null,
    [sessions, editingSessionId],
  );
  const filteredSessions = useMemo(() => {
    const normalizedName = nameFilter.trim().toLocaleLowerCase();
    const fromMinutes = parseTimeToMinutes(timeFrom);
    const toMinutes = parseTimeToMinutes(timeTo);

    return sessions.filter((session) => {
      if (
        normalizedName &&
        !session.title.toLocaleLowerCase().includes(normalizedName)
      ) {
        return false;
      }

      const dateKey = toLocalDateKey(session.timestamp);
      if (dateFrom && dateKey < dateFrom) return false;
      if (dateTo && dateKey > dateTo) return false;

      const minutes = toMinutesSinceMidnight(session.timestamp);
      if (fromMinutes !== null && minutes < fromMinutes) return false;
      if (toMinutes !== null && minutes > toMinutes) return false;

      return true;
    });
  }, [sessions, nameFilter, dateFrom, dateTo, timeFrom, timeTo]);
  const hasFilters = Boolean(
    nameFilter.trim() || dateFrom || dateTo || timeFrom || timeTo,
  );

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!editingSessionId) return;
    if (!sessions.some((s) => s.id === editingSessionId)) {
      setEditingSessionId(null);
      setDraftTitle("");
      setValidationError(null);
      setSaveError(null);
    }
  }, [sessions, editingSessionId]);

  const beginEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setDraftTitle(session.title);
    setValidationError(null);
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setDraftTitle("");
    setValidationError(null);
    setSaveError(null);
    setSavingSessionId(null);
  };

  const validateTitle = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return t("chatHistory.errEmptyName");
    if (trimmed.length > MAX_CHAT_TITLE_LENGTH) {
      return t("chatHistory.errNameTooLong", { max: MAX_CHAT_TITLE_LENGTH });
    }
    const lowerTrimmed = trimmed.toLocaleLowerCase();
    const duplicate = sessions.some(
      (s) =>
        s.id !== editingSessionId &&
        s.title.trim().toLocaleLowerCase() === lowerTrimmed,
    );
    if (duplicate) {
      return t("chatHistory.errDuplicate");
    }
    return null;
  };

  const saveEdit = async () => {
    if (!editingSession) return;
    const err = validateTitle(draftTitle);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setSaveError(null);
    const trimmed = draftTitle.trim();
    setSavingSessionId(editingSession.id);
    try {
      await onRenameSession?.(editingSession.id, trimmed);
      setToastMessage(t("chatHistory.toastRenamed"));
      cancelEdit();
    } catch {
      setSaveError(t("chatHistory.errRename"));
      setSavingSessionId(null);
    }
  };

  const confirmAndDelete = async (session: ChatSession) => {
    if (deletingSessionId || savingSessionId) return;
    const ok = window.confirm(t("chatHistory.confirmDelete"));
    if (!ok) return;
    await deleteSession(session.id);
  };

  const deleteSession = async (sessionId: string) => {
    setDeleteErrorSessionId(null);
    setDeleteError(null);
    setDeletingSessionId(sessionId);
    try {
      await onDeleteSession?.(sessionId);
      setToastMessage(t("chatHistory.toastDeleted"));
    } catch {
      setDeleteErrorSessionId(sessionId);
      setDeleteError(t("chatHistory.errDelete"));
    } finally {
      setDeletingSessionId(null);
    }
  };

  const confirmAndDeleteAll = async () => {
    if (!hasSessions || deletingSessionId || savingSessionId || isDeletingAll) return;
    const ok = window.confirm(t("chatHistory.confirmDeleteAll"));
    if (!ok) return;
    setDeleteErrorSessionId(null);
    setDeleteError(null);
    setIsDeletingAll(true);
    try {
      await onDeleteAllSessions?.();
      setToastMessage(t("chatHistory.toastDeletedAll"));
    } catch {
      setDeleteErrorSessionId("__all__");
      setDeleteError(t("chatHistory.errDeleteAll"));
    } finally {
      setIsDeletingAll(false);
    }
  };

  const clearFilters = () => {
    setNameFilter("");
    setDateFrom("");
    setDateTo("");
    setTimeFrom("");
    setTimeTo("");
  };

  return (
    <aside className="chat-history" aria-label={t("chatHistory.aria")}>
      <button
        type="button"
        className="btn chat-history-new"
        onClick={() => onCreateNewChat?.()}
      >
        {t("chatHistory.newChat")}
      </button>
      <button
        type="button"
        className="chat-history-inline-btn chat-history-clear-all"
        onClick={() => void confirmAndDeleteAll()}
        disabled={!hasSessions || Boolean(deletingSessionId) || isDeletingAll}
        aria-disabled={!hasSessions || Boolean(deletingSessionId) || isDeletingAll}
      >
        {isDeletingAll ? t("chatHistory.deletingAll") : t("chatHistory.deleteAll")}
      </button>
      {toastMessage && (
        <div className="chat-history-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
      {deleteErrorSessionId === "__all__" && deleteError && (
        <div className="chat-history-delete-error" role="alert">
          <span>{deleteError}</span>
          <button
            type="button"
            className="chat-history-inline-btn chat-history-inline-btn--retry"
            onClick={() => void confirmAndDeleteAll()}
            disabled={isDeletingAll}
          >
            {t("chatHistory.retry")}
          </button>
        </div>
      )}
      <h3 className="chat-history-title">{t("chatHistory.title")}</h3>
      <div className="chat-history-filter-toggle-wrap">
        <button
          type="button"
          className="chat-history-inline-btn chat-history-filter-toggle"
          aria-expanded={isFilterOpen}
          aria-controls="chat-history-filters-panel"
          onClick={() => setIsFilterOpen((v) => !v)}
        >
          {isFilterOpen ? t("chatHistory.filtersHide") : t("chatHistory.filtersShow")}
        </button>
        {hasFilters && <span className="chat-history-filter-badge">{t("chatHistory.filterActive")}</span>}
      </div>
      {isFilterOpen && (
        <div
          id="chat-history-filters-panel"
          className="chat-history-filters"
          aria-label={t("chatHistory.filtersAria")}
        >
          <label className="visually-hidden" htmlFor="chat-filter-name">
            {t("chatHistory.searchLabel")}
          </label>
          <input
            id="chat-filter-name"
            type="search"
            className="chat-history-filter-input"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder={t("chatHistory.searchPlaceholder")}
          />
          <div className="chat-history-filter-row">
            <label className="chat-history-filter-label">
              {t("chatHistory.fromDate")}
              <input
                type="date"
                className="chat-history-filter-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="chat-history-filter-label">
              {t("chatHistory.toDate")}
              <input
                type="date"
                className="chat-history-filter-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
          </div>
          <div className="chat-history-filter-row">
            <label className="chat-history-filter-label">
              {t("chatHistory.fromTime")}
              <input
                type="time"
                className="chat-history-filter-input"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
              />
            </label>
            <label className="chat-history-filter-label">
              {t("chatHistory.toTime")}
              <input
                type="time"
                className="chat-history-filter-input"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="chat-history-inline-btn chat-history-filter-clear"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            {t("chatHistory.clearFilters")}
          </button>
        </div>
      )}
      <div className="chat-history-body">
        {!hasSessions ? (
          <p className="chat-history-empty" role="status">
            {t("chatHistory.empty")}
          </p>
        ) : filteredSessions.length === 0 ? (
          <p className="chat-history-empty" role="status">
            {t("chatHistory.emptyFiltered")}
          </p>
        ) : (
          <ul className="chat-history-list">
            {filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingSessionId;
              const isSaving = session.id === savingSessionId;
              const isDeleting = session.id === deletingSessionId;
              return (
              <li key={session.id}>
                {!isEditing ? (
                  <div className="chat-history-item-wrap">
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
                      {session.snippet && (
                        <span className="chat-history-item-snippet">
                          {session.snippet}
                        </span>
                      )}
                      <time
                        className="chat-history-item-time"
                        dateTime={new Date(session.timestamp).toISOString()}
                      >
                        {formatSessionDate(session.timestamp, dateLocaleTag)} •{" "}
                        {formatSessionTime(session.timestamp, dateLocaleTag)}
                      </time>
                    </button>
                    <div className="chat-history-item-controls">
                      <button
                        type="button"
                        className="chat-history-edit-trigger"
                        aria-label={t("chatHistory.editNameFor", { title: session.title })}
                        title={t("chatHistory.editNameTitle")}
                        onClick={() => beginEdit(session)}
                        disabled={isDeleting}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="chat-history-delete-trigger"
                        aria-label={t("chatHistory.deleteChat", { title: session.title })}
                        title={t("chatHistory.deleteChatTitle")}
                        onClick={() => void confirmAndDelete(session)}
                        disabled={isDeleting}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                    {deleteErrorSessionId === session.id && deleteError && (
                      <div className="chat-history-delete-error" role="alert">
                        <span>{deleteError}</span>
                        <button
                          type="button"
                          className="chat-history-inline-btn chat-history-inline-btn--retry"
                          onClick={() => void deleteSession(session.id)}
                          disabled={isDeleting}
                        >
                          {t("chatHistory.retry")}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="chat-history-edit">
                    <label
                      htmlFor={`chat-rename-${session.id}`}
                      className="visually-hidden"
                    >
                      {t("chatHistory.renameLabel")}
                    </label>
                    <input
                      id={`chat-rename-${session.id}`}
                      className="chat-history-edit-input"
                      type="text"
                      value={draftTitle}
                      maxLength={MAX_CHAT_TITLE_LENGTH}
                      onChange={(e) => {
                        setDraftTitle(e.target.value);
                        setValidationError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void saveEdit();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <div className="chat-history-edit-actions">
                      <button
                        type="button"
                        className="chat-history-inline-btn chat-history-inline-btn--save"
                        onClick={() => void saveEdit()}
                        disabled={isSaving}
                      >
                        {t("chatHistory.save")}
                      </button>
                      <button
                        type="button"
                        className="chat-history-inline-btn"
                        onClick={cancelEdit}
                        disabled={isSaving}
                      >
                        {t("chatHistory.cancel")}
                      </button>
                      {saveError && (
                        <button
                          type="button"
                          className="chat-history-inline-btn chat-history-inline-btn--retry"
                          onClick={() => void saveEdit()}
                          disabled={isSaving}
                        >
                          {t("chatHistory.retry")}
                        </button>
                      )}
                    </div>
                    {(validationError || saveError) && (
                      <p className="chat-history-edit-error" role="alert">
                        {validationError ?? saveError}
                      </p>
                    )}
                  </div>
                )}
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
