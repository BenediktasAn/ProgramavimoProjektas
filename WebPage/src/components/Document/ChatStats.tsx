import { useEffect, useState } from "react";
import { useLocale } from "../../i18n/LocaleContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface Stats {
    total_questions: number;
    questions_today: number;
    top_keywords: { word: string; count: number }[];
}

export default function ChatStats() {
    const { t } = useLocale();
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/stats`)
            .then((res) => res.json())
            .then((data) => setStats(data))
            .catch(() => setError(true));
    }, []);

    const downloadCsv = async () => {
        setDownloading(true);
        try {
            const res = await fetch(`${API_URL}/api/stats/export`);
            const blob = await res.blob();
            const today = new Date().toISOString().slice(0, 10);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `askktu-stats-${today}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setDownloading(false);
        }
    };

    if (error) return <p>{t("stats.loadError")}</p>;
    if (!stats) return <p>{t("stats.loading")}</p>;

    return (
        <div className="chat-stats">
            <div className="chat-stats-header">
                <h2>{t("stats.usageHeading")}</h2>
                <button
                    type="button"
                    className="btn btn--sm"
                    onClick={downloadCsv}
                    disabled={downloading}
                    title="Download question log as CSV"
                >
                    {downloading ? "Downloading…" : "Download CSV"}
                </button>
            </div>
            <ul className="chat-stats-list">
                <li><span>{t("stats.totalQuestions")}</span><strong>{stats.total_questions}</strong></li>
                <li><span>{t("stats.questionsToday")}</span><strong>{stats.questions_today}</strong></li>
            </ul>
            {stats.top_keywords.length > 0 && (
                <>
                    <h3>{t("stats.topKeywords")}</h3>
                    <ul className="chat-stats-keywords">
                        {stats.top_keywords.map((k) => (
                            <li key={k.word}>
                                <span>{k.word}</span>
                                <strong>{k.count}</strong>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
