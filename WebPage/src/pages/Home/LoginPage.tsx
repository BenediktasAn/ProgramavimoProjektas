import { useState } from "react";

interface LoginPageProps {
    onLoginSuccess: () => void;
}

const PRESET_USER = "Robots.txt";
const PRESET_PASS = "KomandaX";

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (username === PRESET_USER && password === PRESET_PASS) {
            localStorage.setItem("isAuthenticated", "true");
            onLoginSuccess();
        } else {
            setError("Invalid username or password");
        }
    };

    return (
        <main className="container" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
            <section className="panel" style={{ width: "100%", maxWidth: 420 }}>
                <h2>Log in</h2>
                <p className="muted">Use your credentials to continue</p>

                <form className="stack" onSubmit={handleSubmit}>
                    <label>
                        <span className="visually-hidden">Username</span>
                        <input
                            className="input"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        <span className="visually-hidden">Password</span>
                        <input
                            className="input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    {error && (
                        <p style={{ color: "#ef4444", fontWeight: 600 }}>{error}</p>
                    )}

                    <button type="submit" className="btn btn--primary">
                        Log in
                    </button>
                </form>

                <p className="muted" style={{ marginTop: 16, fontSize: "0.85rem" }}>
                </p>
            </section>
        </main>
    );
}