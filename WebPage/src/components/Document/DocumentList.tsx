interface DocumentItem {
    name: string;
    type: string;
    size?: string;
}

const mockDocuments: DocumentItem[] = [
    { name: "DocumentEx1.pdf", type: "PDF Document", size: "1.2 MB" },
    { name: "DocumentEx2.pdf", type: "PDF Document", size: "450 KB" },
    { name: "DocumentEx3.pdf", type: "PDF Document", size: "8 KB" }
];

export default function DocumentList() {
    return (
        <div className="document-list">
            <h2>Documents</h2>

            <ul>
                {mockDocuments.map((doc, index) => (
                    <li key={index} className="document-item">
                        <div>
                            <strong>{doc.name}</strong>
                            <p>{doc.type}</p>
                        </div>
                        <span className="document-size">{doc.size}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}