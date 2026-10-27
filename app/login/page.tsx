"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import GovEmblem from "@/components/GovEmblem";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("officer@demo.gov.in");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [justAutofilled, setJustAutofilled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  function handleAutoFill() {
    setEmail("officer@demo.gov.in");
    setPassword("demo1234");
    setError("");
    setJustAutofilled(true);
    setTimeout(() => setJustAutofilled(false), 2000);
  }

  return (
    <div className="login-root">
      {/* Top Subtle Tricolor Bar */}
      <div className="gov-ribbon fixed top-0 left-0 right-0 z-50" />

      {/* Left Showcase Hero Panel */}
      <div className="login-left">
        <div className="login-left-content">
          {/* Official Emblem & Department Banner */}
          <div className="emblem-wrapper">
            <GovEmblem size={64} style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))", flexShrink: 0 }} />
            <div>
              <div className="dept-tag">हरियाणा सरकार • समाज कल्याण विभाग</div>
              <div className="state-tag">GOVERNMENT OF HARYANA</div>
            </div>
          </div>

          <div className="hero-text-block">
            <h1 className="hero-main-title">
              वृद्धावस्था सम्मान भत्ता
              <span className="hero-title-highlight"> समीक्षा एवं निर्णय पोर्टल</span>
            </h1>
            <p className="hero-subtitle">
              हरियाणा वृद्धा पेंशन योजना के अंतर्गत आवेदनों के त्वरित, पारदर्शी एवं
              AI-सहायक सत्यापन हेतु अधिकृत तहसील/ब्लॉक अधिकारी मंच।
            </p>
          </div>

          {/* Feature Highlights Bento Cards */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon ai-glow">🤖</div>
              <div>
                <div className="feature-title">Google Gemini AI सह-पायलट</div>
                <div className="feature-desc">
                  पात्रता नियम, आयु (60+ वर्ष) व बैंक खाते के नाम की विसंगति का स्वतः विश्लेषण
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon sla-glow">⏱️</div>
              <div>
                <div className="feature-title">SLA समय-सीमा ट्रैकिंग (30 दिन)</div>
                <div className="feature-desc">
                  सेवा का अधिकार अधिनियम के अंतर्गत प्राथमिकता क्रमबद्ध कार्यप्रवाह
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon audit-glow">🛡️</div>
              <div>
                <div className="feature-title">अपरिवर्तनीय डिजिटल ऑडिट ट्रेल</div>
                <div className="feature-desc">
                  तहसीलदार व नोडल अधिकारी के प्रत्येक अनुमोदन व अस्वीकृति का समय-अंकित रिकॉर्ड
                </div>
              </div>
            </div>
          </div>

          {/* Live System Indicator */}
          <div className="system-status-strip">
            <div className="status-pill">
              <span className="live-dot pulse-dot"></span>
              <span>Neon PostgreSQL Cloud • 20 लाइव आवेदन सुरक्षित</span>
            </div>
            <div className="status-badge-hry">डिजिटल हरियाणा मिशन 2026</div>
          </div>
        </div>
      </div>

      {/* Right Login Station */}
      <div className="login-right">
        <div className="login-box-container">
          {/* Quick Demo Autofill Banner */}
          <div className="demo-callout-card">
            <div className="demo-callout-header">
              <div className="demo-icon">⚡</div>
              <div style={{ flex: 1 }}>
                <div className="demo-title">मूल्यांकनकर्ता / समीक्षक हेतु त्वरित लॉगिन</div>
                <div className="demo-sub">
                  अधिकारी क्रेडेंशियल्स: <code className="demo-code">officer@demo.gov.in</code> / <code className="demo-code">demo1234</code>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className={`btn-autofill ${justAutofilled ? "autofill-active" : ""}`}
            >
              {justAutofilled ? "✓ क्रेडेंशियल्स भरे गए!" : "⚡ 1-क्लिक ऑटोफिल (Auto-Fill Demo)"}
            </button>
          </div>

          <form className="login-card" onSubmit={handleSubmit}>
            <div className="login-card-header">
              <div className="card-badge">
                <span className="lock-icon">🔐</span>
                <span>अधिकारी अधिकृत प्रवेश</span>
              </div>
              <h2 className="login-card-title">पोर्टल में प्रवेश करें</h2>
              <p className="login-card-desc">
                पेंशन समीक्षा प्रणाली तक पहुँचने के लिए अपनी शासकीय साख दर्ज करें
              </p>
            </div>

            {error && (
              <div className="login-error-alert" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                शासकीय ईमेल पता
              </label>
              <div className="input-with-icon">
                <span className="field-icon">✉️</span>
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
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                पासवर्ड (Secret Key)
              </label>
              <div className="input-with-icon">
                <span className="field-icon">🔑</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "पासवर्ड छिपाएं" : "पासवर्ड दिखाएं"}
                  title={showPassword ? "पासवर्ड छिपाएं" : "पासवर्ड दिखाएं"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner-wrap">
                  <span className="spinner-border"></span>
                  प्रमाणीकरण हो रहा है…
                </span>
              ) : (
                <span>लॉगिन करें (सुरक्षित प्रवेश) →</span>
              )}
            </button>

            <div className="login-security-footer">
              <div className="security-icon-row">
                <span>🔒 256-Bit SSL एन्क्रिप्टेड</span>
                <span>•</span>
                <span>JWT सेशन</span>
                <span>•</span>
                <span>राज्य डेटा केंद्र (SDC)</span>
              </div>
              <p className="legal-notice">
                यह प्रणाली केवल अधिकृत सरकारी अधिकारियों के शासकीय उपयोग के लिए है।
              </p>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .login-root {
          display: flex;
          min-height: 100dvh;
          font-family: var(--font-devanagari);
          background-color: var(--clr-surface);
        }

        /* Left Showcase Panel */
        .login-left {
          flex: 1.15;
          background: linear-gradient(155deg, #07152b 0%, #0b1f3a 50%, #153763 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3.5rem 3rem;
          position: relative;
          color: white;
          overflow: hidden;
        }

        .login-left::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 10% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 45%);
          pointer-events: none;
        }

        .login-left-content {
          max-width: 600px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .emblem-wrapper {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .emblem-shield {
          width: 58px;
          height: 58px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fbd38d;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .dept-tag {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fbd38d;
          letter-spacing: 0.02em;
        }

        .state-tag {
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--font-sans);
          font-weight: 600;
        }

        .hero-main-title {
          font-size: 2.35rem;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.01em;
          color: #ffffff;
        }

        .hero-title-highlight {
          display: block;
          background: linear-gradient(90deg, #fbd38d 0%, #ffedd5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 0.5rem;
        }

        /* Features Grid */
        .features-grid {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          padding: 0.9rem 1.15rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }

        .feature-icon {
          font-size: 1.4rem;
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .feature-title {
          font-weight: 600;
          font-size: 0.92rem;
          color: #ffffff;
        }

        .feature-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
          margin-top: 0.15rem;
        }

        /* System Status */
        .system-status-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }

        .status-badge-hry {
          background: rgba(251, 211, 141, 0.15);
          color: #fbd38d;
          border: 1px solid rgba(251, 211, 141, 0.3);
          border-radius: 6px;
          padding: 0.2rem 0.6rem;
          font-weight: 500;
        }

        /* Right Login Panel */
        .login-right {
          flex: 0.95;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          background-color: #f8fafc;
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .login-box-container {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Demo Callout */
        .demo-callout-card {
          background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
          border: 1.5px solid #bfdbfe;
          border-radius: 14px;
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: var(--shadow-sm);
        }

        .demo-callout-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .demo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .demo-title {
          font-weight: 700;
          font-size: 0.88rem;
          color: #1e3a8a;
        }

        .demo-sub {
          font-size: 0.76rem;
          color: #475569;
          line-height: 1.4;
          margin-top: 0.15rem;
        }

        .demo-code {
          font-family: var(--font-sans);
          background: rgba(30, 58, 138, 0.08);
          color: #1e3a8a;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          font-size: 0.74rem;
          font-weight: 600;
        }

        .btn-autofill {
          background: #ffffff;
          border: 1.5px solid #93c5fd;
          border-radius: 8px;
          padding: 0.55rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1d4ed8;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-autofill:hover {
          background: #1d4ed8;
          color: #ffffff;
          border-color: #1d4ed8;
          transform: translateY(-1px);
        }

        .autofill-active {
          background: #059669 !important;
          color: #ffffff !important;
          border-color: #059669 !important;
        }

        /* Main Login Card */
        .login-card {
          background: #ffffff;
          border: 1px solid var(--clr-border);
          border-radius: 16px;
          padding: 2.25rem;
          box-shadow: var(--shadow-elevated);
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
        }

        .login-card-header {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .card-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--clr-navy-light);
          color: var(--clr-navy);
          border: 1px solid #c7d7eb;
          border-radius: 999px;
          padding: 0.2rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          width: fit-content;
        }

        .login-card-title {
          font-size: 1.55rem;
          font-weight: 700;
          color: var(--clr-navy);
          letter-spacing: -0.01em;
          margin-top: 0.25rem;
        }

        .login-card-desc {
          font-size: 0.85rem;
          color: var(--clr-text-secondary);
        }

        .login-error-alert {
          background: var(--clr-red-light);
          border: 1px solid var(--clr-red-border);
          border-radius: 10px;
          padding: 0.8rem 1rem;
          color: var(--clr-red);
          font-size: 0.86rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .form-label {
          font-size: 0.86rem;
          font-weight: 600;
          color: #1e293b;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 1rem;
          font-size: 1rem;
          pointer-events: none;
          opacity: 0.7;
        }

        .form-input {
          width: 100%;
          border: 1.5px solid var(--clr-border);
          border-radius: 10px;
          padding: 0.75rem 2.85rem 0.75rem 2.85rem;
          font-family: var(--font-devanagari);
          font-size: 0.95rem;
          color: var(--clr-text);
          background: #ffffff;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
          outline: none;
        }

        .btn-toggle-pwd {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.1rem;
          padding: 0.25rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: opacity 0.15s ease;
        }

        .btn-toggle-pwd:hover {
          opacity: 1;
        }

        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .btn-submit {
          background: linear-gradient(135deg, #0b1f3a 0%, #163660 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 0.95rem 1.5rem;
          font-family: var(--font-devanagari);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(11, 31, 58, 0.2);
        }

        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #102a4e 0%, #1e4577 100%);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(11, 31, 58, 0.28);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner-wrap {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .spinner-border {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .login-security-footer {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          text-align: center;
          margin-top: 0.5rem;
        }

        .security-icon-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.72rem;
          color: var(--clr-text-muted);
          font-weight: 500;
          font-family: var(--font-sans);
        }

        .legal-notice {
          font-size: 0.72rem;
          color: var(--clr-text-muted);
          line-height: 1.4;
        }

        @media (max-width: 900px) {
          .login-root {
            flex-direction: column;
          }
          .login-left {
            padding: 3rem 1.5rem;
          }
          .login-right {
            padding: 2rem 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
