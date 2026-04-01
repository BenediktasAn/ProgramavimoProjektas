import { useEffect, useState } from "react";

interface DocumentItem {
    name: string;
    size: string;
}

export default function DocumentList() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    const handleDownload = (fileName: string) => {
        // This will trigger download from the backend
        const link = document.createElement("a");
        link.href = `/documents/${fileName}`;        // Uses Vite proxy
        link.download = fileName;                    // Forces download with original name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="document-list">
            <h2>Documents</h2>

            {loading && <p>Loading...</p>}
            {error && <p>Could not load documents.</p>}

                {documents.map((doc, index) => (
                    <li key={index} className="document-item">
                        <div className="document-info">
                            <strong>{doc.name}</strong>
                            <p>PDF Document</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <span className="document-size">{doc.size}</span>
                            <button
                                onClick={() => handleDownload(doc.name)}
                                className="download-btn"
                                title="Download document"
                            >
                                Download
                            </button>
                        </div>
                    </li>
                ))}
        </div>
    );
}
