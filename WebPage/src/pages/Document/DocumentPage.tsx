import PageLayoutDocs from "../../components/layout/PageLayout/PageLayoutDocs";
import Header from "../../components/layout/Header/Header";
import { TopNav } from "../../components/layout/TopNav/TopNav";
import Footer from "../../components/layout/Footer/Footer";
import logoSrc from "../../assets/logo.png";
import DocumentList from "../../components/Document/DocumentList";
import DocumentPreview from "../../components/Document/DocumentPreview";
import {useState} from "react";



export default function DocumentPage() {
    const [selectedDocument, setSelectedDocument] = useState<string>();
    return (
        <PageLayoutDocs
            header={<Header logo={{ src: logoSrc, alt: "askKTU logo" }} />}
            topNav={<TopNav />}
            rightMain={
                <div className="hero-layout docs-layout">
                    {/* Left: document list */}
                    <DocumentList onSelect={setSelectedDocument} />

                    {/* Right: preview */}
                    <DocumentPreview fileName={selectedDocument} />
                </div>
            }
            footer={<Footer />}
        />
    );
}

