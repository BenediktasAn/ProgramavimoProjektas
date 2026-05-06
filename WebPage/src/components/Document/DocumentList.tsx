import { useEffect, useState } from "react";
import { useLocale } from "../../i18n/LocaleContext";


interface DocumentItem {
    name: string;
    size: string;
}

interface DocumentListProps {
    onSelect: (fileName: string) => void;
}


export default function DocumentList({ onSelect }: DocumentListProps) {
    const { t } = useLocale();
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleDownload = (fileName: string) => {
        // Vite serves files from src/assets as /src/assets/...
        const link = document.createElement("a");
        link.href = `/src/assets/documents/${fileName}`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetch("/api/documents")
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


    return (
        <div className="document-list">
            <h2>{t("documents.listTitle")}</h2>

            {loading && <p>{t("documents.loading")}</p>}
            {error && <p>{t("documents.error")}</p>}


            <ul>
                {documents.map((doc) => (
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
                                    e.stopPropagation(); // important!
                                    handleDownload(doc.name);
                                }}
                            >
                                {t("documents.download")}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>


        </div>
    );
}