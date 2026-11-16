"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { translations, SupportedLanguage } from "./translations";
import { useOptionalOrgSettings } from "@/components/providers/OrganizationSettingsContext";
import { updateLanguageAction } from "@/lib/actions/actionsSettings";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  localeText: (options: { th: string; en: string }) => string;
  isThai: boolean;
  isEnglish: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function resolveTranslation(
  lang: SupportedLanguage,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] || translations.th;
  const parts = path.split(".");
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      // Fallback to Thai if missing in English
      let fallbackCurrent: any = translations.th;
      for (const fPart of parts) {
        if (fallbackCurrent && typeof fallbackCurrent === "object" && fPart in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[fPart];
        } else {
          return path;
        }
      }
      current = fallbackCurrent;
      break;
    }
  }

  if (typeof current !== "string") {
    return path;
  }

  if (params) {
    let result = current;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    }
    return result;
  }

  return current;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const orgContext = useOptionalOrgSettings();
  const settings = orgContext?.settings;
  const refetchSettings = orgContext?.refetchSettings;

  // Always start with 'th' to match server rendering (avoid hydration mismatch)
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("th");

  // Sync language from DB or LocalStorage smoothly (Merged effects)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Priority 1: อิงจากค่าใน Database (ถ้ามี)
      if (settings?.languageCode) {
        const code = settings.languageCode.toLowerCase() as SupportedLanguage;
        if (code === "th" || code === "en") {
          setCurrentLang((prev) => {
            if (prev !== code) {
              if (typeof window !== "undefined") {
                localStorage.setItem("posx_language", code);
              }
              return code;
            }
            return prev;
          });
          return;
        }
      }

      // Priority 2: ถ้าไม่มี DB ให้ Fallback มาใช้ค่าใน LocalStorage
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("posx_language");
        if (saved === "th" || saved === "en") {
          setCurrentLang((prev) => (prev !== saved ? (saved as SupportedLanguage) : prev));
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [settings?.languageCode]);

  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      setCurrentLang(lang);
      if (typeof window !== "undefined") {
        localStorage.setItem("posx_language", lang);
      }

      if (settings?.organizationId) {
        try {
          await updateLanguageAction(settings.organizationId, lang);
          if (refetchSettings) {
            await refetchSettings();
          }
        } catch (error) {
          console.error("Failed to persist language setting:", error);
        }
      }
    },
    [settings, refetchSettings]
  );

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return resolveTranslation(currentLang, path, params);
    },
    [currentLang]
  );

  const localeText = useCallback(
    (options: { th: string; en: string }) => {
      return currentLang === "en" ? options.en : options.th;
    },
    [currentLang]
  );

  const value: LanguageContextType = {
    language: currentLang,
    setLanguage,
    t,
    localeText,
    isThai: currentLang === "th",
    isEnglish: currentLang === "en",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom Hook to use translations anywhere
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback when used outside LanguageProvider
    const fallbackLang: SupportedLanguage = "th";

    return {
      language: fallbackLang,
      setLanguage: async () => { },
      t: (path: string, params?: Record<string, string | number>) =>
        resolveTranslation(fallbackLang, path, params),
      localeText: (options: { th: string; en: string }) => options.th,
      isThai: true,
      isEnglish: false,
    };
  }
  return context;
}

export const useTranslation = useLanguage;