import { useEffect, useState } from "react";
import { useLocale } from "../../i18n/LocaleContext";

interface Stats {
    total_questions: number;
    questions_today: number;
    top_keywords: { word: string; count: number }[];
}

export default function ChatStats() {
    const { t } = useLocale();
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch("/api/stats")
            .then((res) => res.json())
            .then((data) => setStats(data))
            .catch(() => setError(true));
    }, []);

    if (error) return <p>{t("stats.loadError")}</p>;
    if (!stats) return <p>{t("stats.loading")}</p>;

    return (
        <div className="chat-stats">
            <h2>{t("stats.usageHeading")}</h2>
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
