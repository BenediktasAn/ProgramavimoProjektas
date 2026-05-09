


import { useEffect, useState } from "react";
import { useLocale } from "../../i18n/LocaleContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface DocumentPreviewProps {
    fileName?: string;
}

export default function DocumentPreview({ fileName }: DocumentPreviewProps) {
    const { t } = useLocale();
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!fileName) {
            setObjectUrl(null);
            return;
        }
        setLoading(true);
        setError(false);
        let revoked = false;
        fetch(`${API_URL}/api/documents/${encodeURIComponent(fileName)}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load");
                return res.blob();
            })
            .then((blob) => {
                if (revoked) return;
                const url = URL.createObjectURL(blob);
                setObjectUrl(url);
                setLoading(false);
            })
            .catch(() => {
                if (!revoked) {
                    setError(true);
                    setLoading(false);
                }
            });
        return () => {
            revoked = true;
            setObjectUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, [fileName]);

    if (!fileName) {
        return (
            <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="muted">{t("documents.previewEmpty")}</p>
            </div>
        );
    }

    return (
        <div
            className="panel"
            style={{
                height: "calc(100vh - 220px)",
                display: "flex",
                flexDirection: "column",
                padding: "12px",
                overflow: "hidden",
            }}
        >
            {loading && <p style={{ margin: "auto" }}>{t("documents.loading")}</p>}
            {error && <p style={{ margin: "auto", color: "var(--error, red)" }}>{t("documents.error")}</p>}
            {objectUrl && (
                <iframe
                    src={objectUrl}
                    title={fileName}
                    style={{ flex: 1, width: "100%", border: "none", borderRadius: "10px" }}
                />
            )}
        </div>
    );
}
