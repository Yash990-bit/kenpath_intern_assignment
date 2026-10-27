"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("officer@demo.gov.in");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("ईमेल या पासवर्ड गलत है। कृपया पुनः प्रयास करें।");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-branding">
          <div className="login-emblem">🏛️</div>
          <h1 className="login-title">वृद्धा पेंशन<br />समीक्षा प्रणाली</h1>
          <p className="login-subtitle">हरियाणा सरकार — समाज कल्याण विभाग</p>
          <div className="login-info-pills">
            <span className="pill">तहसील/ब्लॉक स्तर</span>
            <span className="pill">AI-सहायक समीक्षा</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-header">
            <span className="login-card-icon">🔐</span>
            <h2 className="login-card-title">अधिकारी लॉगिन</h2>
            <p className="login-card-desc">अपनी साख दर्ज करें</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              ईमेल पता
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@demo.gov.in"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              पासवर्ड
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "प्रमाणीकरण हो रहा है…" : "लॉगिन करें"}
          </button>

          <div className="login-demo-hint">
            <span>डेमो साख:</span>
            <code>officer@demo.gov.in</code>
            <code>demo1234</code>
          </div>
        </form>
      </div>

      <style jsx>{`
        .login-root {
          display: flex;
          min-height: 100dvh;
          font-family: var(--font-devanagari);
        }

        /* Left panel */
        .login-left {
          flex: 1;
          background: linear-gradient(145deg, #0f2e5e 0%, #1a3f7a 60%, #ff6b00 140%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          position: relative;
          overflow: hidden;
        }
        .login-left::before {
          content: "";
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .login-branding {
          position: relative;
          text-align: center;
          color: white;
        }
        .login-emblem {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
        }
        .login-title {
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 0.75rem;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .login-subtitle {
          font-size: 0.95rem;
          opacity: 0.8;
          margin-bottom: 2rem;
        }
        .login-info-pills {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .pill {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 999px;
          padding: 0.35rem 1rem;
          font-size: 0.82rem;
          backdrop-filter: blur(4px);
        }

        /* Right panel */
        .login-right {
          width: min(480px, 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--clr-surface);
        }

        /* Card */
        .login-card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 40px rgba(15,46,94,0.12);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .login-card-header {
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .login-card-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 0.75rem;
        }
        .login-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--clr-navy);
        }
        .login-card-desc {
          font-size: 0.88rem;
          color: var(--clr-text-secondary);
          margin-top: 0.25rem;
        }

        .login-error {
          background: var(--clr-red-light);
          border: 1px solid #f5c6c2;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: var(--clr-red);
          font-size: 0.9rem;
        }

        /* Form elements */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--clr-text-secondary);
        }
        .form-input {
          border: 1.5px solid var(--clr-border);
          border-radius: 8px;
          padding: 0.7rem 1rem;
          font-family: var(--font-devanagari);
          font-size: 0.95rem;
          color: var(--clr-text);
          background: var(--clr-surface);
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--clr-navy-mid);
          box-shadow: 0 0 0 3px rgba(15,46,94,0.1);
        }

        /* Buttons */
        .btn-primary {
          background: linear-gradient(135deg, var(--clr-navy) 0%, var(--clr-navy-mid) 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.85rem 1.5rem;
          font-family: var(--font-devanagari);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .btn-full {
          width: 100%;
        }

        .login-demo-hint {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
          font-size: 0.78rem;
          color: var(--clr-text-secondary);
          background: var(--clr-navy-light);
          border-radius: 8px;
          padding: 0.6rem 1rem;
        }
        .login-demo-hint code {
          background: white;
          border: 1px solid var(--clr-border);
          border-radius: 4px;
          padding: 0.15rem 0.5rem;
          font-size: 0.78rem;
          color: var(--clr-navy);
        }

        @media (max-width: 700px) {
          .login-left { display: none; }
          .login-right { width: 100%; }
        }
      `}</style>
    </div>
  );
}
