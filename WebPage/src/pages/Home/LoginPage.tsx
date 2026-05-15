import { useState } from "react";
import { useLocale } from "../../i18n/LocaleContext";

interface LoginPageProps {
    onLoginSuccess: () => void;
}

const PRESET_USER = "Robots.txt";
const PRESET_PASS = "KomandaX";

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const { t } = useLocale();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (username === PRESET_USER && password === PRESET_PASS) {
            localStorage.setItem("isAuthenticated", "true");
            onLoginSuccess();
        } else {
            setError(t("login.errorInvalid"));
        }
    };

    return (
        <main className="container" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
            <section className="panel" style={{ width: "100%", maxWidth: 420 }}>
                <h2>{t("login.title")}</h2>
                <p className="muted">{t("login.subtitle")}</p>

                <form className="stack" onSubmit={handleSubmit}>
                    <label>
                        <span className="visually-hidden">{t("login.username")}</span>
                        <input
                            className="input"
                            type="text"
                            placeholder={t("login.username")}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        <span className="visually-hidden">{t("login.password")}</span>
                        <input
                            className="input"
                            type="password"
                            placeholder={t("login.password")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    {error && (
                        <p className="form-error-text">{error}</p>
                    )}

                    <button type="submit" className="btn btn--primary">
                        {t("login.submit")}
                    </button>
                </form>

                <p className="muted" style={{ marginTop: 16, fontSize: "0.85rem" }}>
                </p>
            </section>
        </main>
    );
}