import { useLocale } from "../../i18n/LocaleContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface DocumentPreviewProps {
    fileName?: string;
}

export default function DocumentPreview({ fileName }: DocumentPreviewProps) {
    const { t } = useLocale();
    if (!fileName) {
        return (
            <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p className="muted">{t("documents.previewEmpty")}</p>
            </div>
        );
    }

    const pdfUrl = `${API_URL}/api/documents/${encodeURIComponent(fileName)}`;

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
            <iframe
                src={pdfUrl}
                title={fileName}
                style={{ flex: 1, width: "100%", border: "none", borderRadius: "10px" }}
            />
        </div>
    );
}
