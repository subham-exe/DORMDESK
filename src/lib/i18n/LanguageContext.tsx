"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { en } from "./dictionaries/en";
import { hi } from "./dictionaries/hi";
import { or } from "./dictionaries/or";

type Language = "en" | "hi" | "or";
type Dictionary = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Dictionary) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<Language, Dictionary> = { en, hi, or };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("dormdesk_lang") as Language;
      if (savedLang && ["en", "hi", "or"].includes(savedLang)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguageState(savedLang);
      }
    } catch {
      // Ignore localStorage errors (e.g., restricted iframe)
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("dormdesk_lang", lang);
    } catch {
      // Ignore
    }
  };

  const t = (key: keyof Dictionary): string => {
    const dict = dictionaries[language] || dictionaries["en"];
    const translation = dict[key];
    if (translation === undefined) {
      // Fallback to English
      return dictionaries["en"][key] || key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
