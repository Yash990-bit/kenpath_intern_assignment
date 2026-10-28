"use client";

import React, { createContext, useContext, useEffect } from "react";
import { Language, translations, Translations } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  interpolate: (template: string, params: Record<string, string | number>) => string;
}

const STORAGE_KEY = "haryana_pension_portal_lang";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("portal-language-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("portal-language-change", callback);
  };
}

function getSnapshot(): Language {
  if (typeof window === "undefined") return "hi";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "hi" ? saved : "hi";
  } catch {
    return "hi";
  }
}

function getServerSnapshot(): Language {
  return "hi";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Sync with localStorage external store (defaults to "hi" on server & fresh load)
  const language = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    try {
      document.documentElement.lang = language;
      document.documentElement.setAttribute("data-lang", language);
    } catch {
      // Ignore
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      document.documentElement.setAttribute("data-lang", lang);
      window.dispatchEvent(new Event("portal-language-change"));
    } catch {
      // Ignore localStorage error
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "hi" ? "en" : "hi");
  };

  // Helper for replacing {variable} in string templates
  const interpolate = (template: string, params: Record<string, string | number>): string => {
    let result = template;
    for (const [key, val] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
    }
    return result;
  };

  const currentTranslations = translations[language] || translations.hi;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: currentTranslations,
        interpolate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: "hi" as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: translations.hi,
      interpolate: (template: string, params: Record<string, string | number>) => {
        let result = template;
        for (const [key, val] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
        }
        return result;
      },
    };
  }
  return context;
}

/**
 * Top Navigation Language Switcher Component
 * Displays 'हिंदी | English' with smooth instant toggle without page reload.
 */
export function LanguageSwitcher({
  variant = "header",
}: {
  variant?: "header" | "login" | "footer";
}) {
  const { language, setLanguage } = useLanguage();

  if (variant === "login") {
    return (
      <div className="login-lang-switch">
        <button
          type="button"
          onClick={() => setLanguage("hi")}
          className={`login-lang-btn ${language === "hi" ? "lang-active" : ""}`}
          aria-label="हिंदी भाषा चुनें"
        >
          हिंदी
        </button>
        <span className="lang-sep">|</span>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`login-lang-btn ${language === "en" ? "lang-active" : ""}`}
          aria-label="Select English Language"
        >
          English
        </button>
        <style jsx>{`
          .login-lang-switch {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid var(--clr-border);
            padding: 0.25rem 0.6rem;
            border-radius: 999px;
            box-shadow: var(--shadow-sm);
            font-size: 0.8rem;
            font-weight: 600;
          }
          .login-lang-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.15rem 0.5rem;
            border-radius: 999px;
            color: var(--clr-text-secondary);
            transition: all 0.15s ease;
            font-family: inherit;
          }
          .login-lang-btn:hover {
            color: var(--clr-navy);
          }
          .lang-active {
            background: #0b1f3a !important;
            color: #ffffff !important;
            box-shadow: 0 1px 4px rgba(11, 31, 58, 0.25);
          }
          .lang-sep {
            color: #94a3b8;
            font-size: 0.75rem;
            user-select: none;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="gov-lang-switch-wrapper" role="group" aria-label="Language Switcher">
      <div className="gov-lang-segmented">
        <button
          type="button"
          onClick={() => setLanguage("hi")}
          className={`lang-option-btn ${language === "hi" ? "is-selected" : ""}`}
          title="हिंदी में देखें"
          aria-pressed={language === "hi"}
        >
          <span>हिंदी</span>
        </button>
        <span className="lang-divider">|</span>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`lang-option-btn ${language === "en" ? "is-selected" : ""}`}
          title="Switch to English"
          aria-pressed={language === "en"}
        >
          <span>English</span>
        </button>
      </div>

      <style jsx>{`
        .gov-lang-switch-wrapper {
          display: inline-flex;
          align-items: center;
        }

        .gov-lang-segmented {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 999px;
          padding: 2px 4px;
          backdrop-filter: blur(8px);
          gap: 2px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .lang-option-btn {
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          outline: none;
          font-family: inherit;
        }

        .lang-option-btn:hover:not(.is-selected) {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        .is-selected {
          background: #ffffff !important;
          color: #07152b !important;
          font-weight: 700 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .lang-divider {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.75rem;
          user-select: none;
          padding: 0 1px;
        }
      `}</style>
    </div>
  );
}
