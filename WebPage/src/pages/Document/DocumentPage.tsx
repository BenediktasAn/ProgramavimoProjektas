import PageLayoutDocs from "../../components/layout/PageLayout/PageLayoutDocs";
import Header from "../../components/layout/Header/Header";
import { TopNav } from "../../components/layout/TopNav/TopNav";
import Footer from "../../components/layout/Footer/Footer";
import logoSrc from "../../assets/logo.png";
import DocumentList from "../../components/Document/DocumentList";


export default function DocumentPage() {
    return (
        <PageLayoutDocs
            header={<Header logo={{ src: logoSrc, alt: "askKTU logo" }} />}
            topNav={<TopNav />}
            rightMain={
                <section className="document-container">
                    <h1>Documents used by chatbot</h1>
                    <p>All available documents:</p>

                    <DocumentList />
                </section>
            }
            footer={<Footer />}
        />
    );
}

