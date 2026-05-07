import { useLocale } from "../../i18n/LocaleContext";

interface DocumentPreviewProps {
    fileName?: string;
}

export default function DocumentPreview({ fileName }: DocumentPreviewProps) {
    const { t } = useLocale();
    if (!fileName) {
        return (
            <div className="panel">
                <p className="muted">{t("documents.previewEmpty")}</p>
            </div>
        );
    }

    return (
        <div className="panel"
             style={{
                 height: "calc(100vh - 220px)",
                 display: "flex",
                 flexDirection: "column"
             }}
        >
            <strong>{fileName}</strong>

            <object
                data={`/src/assets/documents/${fileName}`}
                type="application/pdf"
                style={{ flex: 1, width: "100%" }}
            />

        </div>
    );
}