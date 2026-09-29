"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as "en" | "hi" | "or")}
        className="bg-surface border border-border text-text-primary text-sm rounded-md px-2 py-1 focus:ring-2 focus:ring-primary focus:outline-none"
        aria-label="Select Language"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="or">ଓଡ଼ିଆ</option>
      </select>
    </div>
  );
}
