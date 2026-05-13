import { useEffect, useMemo, useState } from "react";
import { useLocale } from "../../i18n/LocaleContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface DocumentItem {
    name: string;
    size: string;
    category: string;
}

interface DocumentListProps {
    onSelect: (fileName: string) => void;
}

export default function DocumentList({ onSelect }: DocumentListProps) {
    const { t } = useLocale();
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>("__all__");
    const [search, setSearch] = useState("");

    const handleDownload = (fileName: string) => {
        const link = document.createElement("a");
        link.href = `${API_URL}/api/documents/${encodeURIComponent(fileName)}?download=true`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetch(`${API_URL}/api/documents`)
            .then((res) => res.json())
            .then((data) => {
                setDocuments(data);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, []);

    const searchFiltered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return documents;
        return documents.filter((d) => d.name.toLowerCase().includes(q));
    }, [documents, search]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const doc of searchFiltered) {
            set.add(doc.category?.trim() || "");
        }
        const named = Array.from(set).filter(Boolean).sort();
        const hasOther = set.has("");
        return ["__all__", ...named, ...(hasOther ? ["__other__"] : [])];
    }, [searchFiltered]);

    const grouped = useMemo(() => {
        if (activeCategory === "__all__") {
            const map = new Map<string, DocumentItem[]>();
            for (const doc of searchFiltered) {
                const key = doc.category?.trim() || "__other__";
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(doc);
            }
            return map;
        }
        const key = activeCategory === "__other__" ? "" : activeCategory;
        const filtered = searchFiltered.filter((d) => (d.category?.trim() || "") === key);
        return new Map([[activeCategory, filtered]]);
    }, [searchFiltered, activeCategory]);

    const categoryLabel = (cat: string) => {
        if (cat === "__all__") return t("documents.categoryAll");
        if (cat === "__other__") return t("documents.categoryOther");
        return cat;
    };

    const renderDoc = (doc: DocumentItem) => (
        <li
            key={doc.name}
            className="document-item"
            onClick={() => onSelect(doc.name)}
            style={{ cursor: "pointer" }}
        >
            <div className="document-info">
                <strong>{doc.name}</strong>
                <p>{t("documents.pdfType")}</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
                <span className="document-size">{doc.size}</span>
                <button
                    className="download-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc.name);
                    }}
                >
                    {t("documents.download")}
                </button>
            </div>
        </li>
    );

    return (
        <div className="document-list">
            <h2>{t("documents.listTitle")}</h2>

            {loading && <p>{t("documents.loading")}</p>}
            {error && <p>{t("documents.error")}</p>}

            {!loading && !error && (
                <div className="doc-search-wrap">
                    <input
                        className="input doc-search-input"
                        type="search"
                        placeholder={t("documents.searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label={t("documents.searchPlaceholder")}
                    />
                </div>
            )}

            {!loading && !error && categories.length > 1 && (
                <div className="doc-category-tabs">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={`doc-category-tab${activeCategory === cat ? " doc-category-tab--active" : ""}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {categoryLabel(cat)}
                        </button>
                    ))}
                </div>
            )}

            {!loading && !error && searchFiltered.length === 0 && (
                <p className="doc-no-results">{t("documents.noResults")}</p>
            )}

            {!loading && !error && Array.from(grouped.entries()).map(([cat, docs]) => (
                <div key={cat}>
                    {activeCategory === "__all__" && categories.length > 1 && (
                        <p className="doc-category-heading">{categoryLabel(cat)}</p>
                    )}
                    <ul>
                        {docs.map(renderDoc)}
                    </ul>
                </div>
            ))}
        </div>
    );
}
