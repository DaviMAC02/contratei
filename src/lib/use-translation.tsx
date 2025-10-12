"use client";

import { createContext, useContext, ReactNode } from "react";
import { translations, type Locale, type TranslationKey } from "./i18n";

interface I18nContextType {
  locale: Locale;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    let translation: string =
      translations[locale][key] || translations["en-US"][key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{${paramKey}}`, String(value));
      });
    }

    return translation;
  };

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}
