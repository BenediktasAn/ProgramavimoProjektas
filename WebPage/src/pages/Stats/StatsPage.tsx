import PageLayoutDocs from "../../components/layout/PageLayout/PageLayoutDocs";
import Header from "../../components/layout/Header/Header";
import { TopNav } from "../../components/layout/TopNav/TopNav";
import Footer from "../../components/layout/Footer/Footer";
import logoSrc from "../../assets/logo.png";
import ChatStats from "../../components/Document/ChatStats";
import { useLocale } from "../../i18n/LocaleContext";

export interface StatsPageProps {
    theme: "light" | "dark";
    onToggleTheme: () => void;
}

export default function StatsPage({ theme, onToggleTheme }: StatsPageProps) {
    const { t } = useLocale();
    return (
        <PageLayoutDocs
            header={
                <Header
                    logo={{ src: logoSrc, alt: "askKTU logo" }}
                    theme={theme}
                    onToggleTheme={onToggleTheme}
                />
            }
            topNav={<TopNav />}
            rightMain={
                <section className="document-container">
                    <h1>{t("stats.title")}</h1>
                    <p>{t("stats.subtitle")}</p>
                    <ChatStats />
                </section>
            }
            footer={<Footer />}
        />
    );
}
