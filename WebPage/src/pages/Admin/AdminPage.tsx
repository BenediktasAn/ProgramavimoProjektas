import { useRef, useState } from "react";
import PageLayoutDocs from "../../components/layout/PageLayout/PageLayoutDocs";
import Header from "../../components/layout/Header/Header";
import { TopNav } from "../../components/layout/TopNav/TopNav";
import Footer from "../../components/layout/Footer/Footer";
import logoSrc from "../../assets/logo.png";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const PRESET_CATEGORIES = [
    "Academic Rules", "Scholarships", "Dormitories", "Student Life", "Exams", "Other",
];

interface FeedbackEntry {
    timestamp: string;
    question: string;
    answer: string;
    rating: "up" | "down";
}

interface DocumentItem {
    name: string;
    size: string;
    category: string;
}

type AdminTab = "upload" | "documents" | "feedback";

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [authed, setAuthed] = useState(false);
    const [authError, setAuthError] = useState("");
    const [activeTab, setActiveTab] = useState<AdminTab>("upload");

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState("");
    const [uploadStatus, setUploadStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Documents tab state
    const [docs, setDocs] = useState<DocumentItem[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [docsError, setDocsError] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [deleteStatus, setDeleteStatus] = useState<Record<string, "deleting" | "error">>({});

    // Feedback state
    const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;
        setAuthed(true);
        setAuthError("");
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setUploadStatus(null);

        const formData = new FormData();
        formData.append("file", file);
        if (category.trim()) formData.append("category", category.trim());

        try {
            const res = await fetch(`${API_URL}/api/admin/upload`, {
                method: "POST",
                headers: { "X-Admin-Password": password },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) { setAuthed(false); setAuthError("Wrong password."); return; }
                setUploadStatus({ kind: "error", message: data.detail ?? "Upload failed." });
            } else {
                setUploadStatus({ kind: "success", message: `"${data.filename}" uploaded and indexed (${data.chunks} chunks).` });
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
            }
        } catch {
            setUploadStatus({ kind: "error", message: "Could not reach the server." });
        } finally {
            setUploading(false);
        }
    };

    const loadDocs = async () => {
        setDocsLoading(true);
        setDocsError(false);
        try {
            const res = await fetch(`${API_URL}/api/documents`);
            if (!res.ok) throw new Error();
            setDocs(await res.json());
        } catch {
            setDocsError(true);
        } finally {
            setDocsLoading(false);
        }
    };

    const deleteDoc = async (filename: string) => {
        setDeleteStatus((prev) => ({ ...prev, [filename]: "deleting" }));
        try {
            const res = await fetch(`${API_URL}/api/admin/documents/${encodeURIComponent(filename)}`, {
                method: "DELETE",
                headers: { "X-Admin-Password": password },
            });
            if (res.status === 401) { setAuthed(false); setAuthError("Wrong password."); return; }
            if (!res.ok) throw new Error();
            setDocs((prev) => prev.filter((d) => d.name !== filename));
            setDeleteStatus((prev) => { const n = { ...prev }; delete n[filename]; return n; });
        } catch {
            setDeleteStatus((prev) => ({ ...prev, [filename]: "error" }));
        } finally {
            setConfirmDelete(null);
        }
    };

    const loadFeedback = async () => {
        setFeedbackLoading(true);
        setFeedbackError(false);
        try {
            const res = await fetch(`${API_URL}/api/admin/feedback`, {
                headers: { "X-Admin-Password": password },
            });
            if (res.status === 401) { setAuthed(false); setAuthError("Wrong password."); return; }
            if (!res.ok) throw new Error();
            setFeedback(await res.json());
        } catch {
            setFeedbackError(true);
        } finally {
            setFeedbackLoading(false);
        }
    };

    const switchTab = (tab: AdminTab) => {
        setActiveTab(tab);
        if (tab === "feedback" && feedback.length === 0 && !feedbackLoading) loadFeedback();
        if (tab === "documents" && docs.length === 0 && !docsLoading) loadDocs();
    };

    const toggleExpanded = (i: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const visibleFeedback = showAll ? feedback : feedback.filter((f) => f.rating === "down");

    const formatTs = (ts: string) =>
        new Date(ts).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });

    return (
        <PageLayoutDocs
            header={<Header logo={{ src: logoSrc, alt: "askKTU logo" }} />}
            topNav={<TopNav />}
            rightMain={
                <section className="document-container">
                    <h1>Admin</h1>

                    {!authed ? (
                        <form className="stack" onSubmit={handleLogin} style={{ maxWidth: 360 }}>
                            <p>Enter the admin password to continue.</p>
                            <input
                                className="input"
                                type="password"
                                placeholder="Admin password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {authError && <p style={{ color: "#ef4444" }}>{authError}</p>}
                            <button type="submit" className="btn btn--primary">Continue</button>
                        </form>
                    ) : (
                        <>
                            <div className="admin-tabs">
                                <button type="button" className={`admin-tab${activeTab === "upload" ? " admin-tab--active" : ""}`} onClick={() => switchTab("upload")}>Upload Document</button>
                                <button type="button" className={`admin-tab${activeTab === "documents" ? " admin-tab--active" : ""}`} onClick={() => switchTab("documents")}>Documents</button>
                                <button type="button" className={`admin-tab${activeTab === "feedback" ? " admin-tab--active" : ""}`} onClick={() => switchTab("feedback")}>Feedback</button>
                            </div>

                            {activeTab === "upload" && (
                                <form className="stack" onSubmit={handleUpload} style={{ maxWidth: 480 }}>
                                    <p>Upload a PDF to add it to the chatbot's knowledge base. It will be indexed automatically.</p>
                                    <input
                                        ref={inputRef}
                                        className="input"
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                        required
                                    />
                                    <div>
                                        <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                                            Category <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(optional)</span>
                                        </label>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                            {PRESET_CATEGORIES.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    className={`doc-category-tab${category === c ? " doc-category-tab--active" : ""}`}
                                                    onClick={() => setCategory(category === c ? "" : c)}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            className="input"
                                            type="text"
                                            placeholder="Or type a custom category…"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        />
                                    </div>
                                    {uploadStatus && (
                                        <p style={{ color: uploadStatus.kind === "success" ? "#16a34a" : "#ef4444", fontWeight: 600 }}>
                                            {uploadStatus.message}
                                        </p>
                                    )}
                                    <button type="submit" className="btn btn--primary" disabled={!file || uploading}>
                                        {uploading ? "Uploading..." : "Upload & Index"}
                                    </button>
                                </form>
                            )}

                            {activeTab === "documents" && (
                                <div style={{ maxWidth: 640 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-200)" }}>
                                            {docs.length} document{docs.length !== 1 ? "s" : ""}
                                        </span>
                                        <button type="button" className="btn btn--sm" onClick={loadDocs} disabled={docsLoading}>
                                            {docsLoading ? "Loading…" : "Refresh"}
                                        </button>
                                    </div>

                                    {docsError && <p style={{ color: "#ef4444" }}>Could not load documents.</p>}

                                    {!docsLoading && !docsError && docs.length === 0 && (
                                        <p style={{ color: "var(--text-secondary)" }}>No documents uploaded yet.</p>
                                    )}

                                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                                        {docs.map((doc) => (
                                            <li key={doc.name} className="admin-doc-row">
                                                <div className="admin-doc-info">
                                                    <strong>{doc.name}</strong>
                                                    <span className="admin-doc-meta">
                                                        {doc.size}{doc.category ? ` · ${doc.category}` : ""}
                                                    </span>
                                                </div>

                                                {confirmDelete === doc.name ? (
                                                    <div className="admin-doc-confirm">
                                                        <span>Delete permanently?</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn--sm admin-doc-confirm-yes"
                                                            onClick={() => deleteDoc(doc.name)}
                                                            disabled={deleteStatus[doc.name] === "deleting"}
                                                        >
                                                            {deleteStatus[doc.name] === "deleting" ? "Deleting…" : "Yes, delete"}
                                                        </button>
                                                        <button type="button" className="btn btn--sm" onClick={() => setConfirmDelete(null)}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn--sm admin-doc-delete-btn"
                                                        onClick={() => { setConfirmDelete(doc.name); setDeleteStatus((p) => { const n = { ...p }; delete n[doc.name]; return n; }); }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}

                                                {deleteStatus[doc.name] === "error" && (
                                                    <span style={{ color: "#ef4444", fontSize: "var(--fs-200)" }}>Failed</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {activeTab === "feedback" && (
                                <div className="admin-feedback">
                                    <div className="admin-feedback-toolbar">
                                        <span className="admin-feedback-count">
                                            {visibleFeedback.length} {showAll ? "total" : "negative"} rating{visibleFeedback.length !== 1 ? "s" : ""}
                                        </span>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <button type="button" className="btn btn--sm" onClick={loadFeedback} disabled={feedbackLoading}>
                                                {feedbackLoading ? "Loading…" : "Refresh"}
                                            </button>
                                            <label className="admin-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={showAll}
                                                    onChange={(e) => setShowAll(e.target.checked)}
                                                />
                                                Show all ratings
                                            </label>
                                        </div>
                                    </div>

                                    {feedbackError && <p style={{ color: "#ef4444" }}>Could not load feedback.</p>}

                                    {!feedbackLoading && !feedbackError && visibleFeedback.length === 0 && (
                                        <p style={{ color: "var(--text-secondary)" }}>
                                            {showAll ? "No feedback yet." : "No negative feedback yet."}
                                        </p>
                                    )}

                                    <div className="admin-feedback-list">
                                        {visibleFeedback.map((entry, i) => (
                                            <div
                                                key={i}
                                                className={`admin-feedback-card admin-feedback-card--${entry.rating}`}
                                            >
                                                <div className="admin-feedback-card-header" onClick={() => toggleExpanded(i)}>
                                                    <span className={`admin-feedback-rating admin-feedback-rating--${entry.rating}`}>
                                                        {entry.rating === "up" ? "👍" : "👎"}
                                                    </span>
                                                    <span className="admin-feedback-question">{entry.question}</span>
                                                    <span className="admin-feedback-ts">{formatTs(entry.timestamp)}</span>
                                                    <span className="admin-feedback-chevron">{expanded.has(i) ? "▲" : "▼"}</span>
                                                </div>
                                                {expanded.has(i) && (
                                                    <div className="admin-feedback-answer">
                                                        <strong>Answer:</strong>
                                                        <p>{entry.answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            }
            footer={<Footer />}
        />
    );
}
