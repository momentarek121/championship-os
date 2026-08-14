import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Language = "en" | "ar";
type Dictionary = Record<string, string>;

export const languageDictionaries: Record<Language, Dictionary> = {
  en: {
    language: "العربية",
    overview: "Overview",
    athletes: "Athletes",
    registrations: "Registrations",
    weighIn: "Weigh-in",
    brackets: "Brackets",
    scoring: "Scoring",
    results: "Results",
    fullScreen: "Full screen",
    noBelt: "No belt",
    belt: "Belt",
    expectedWeight: "Expected weight (KG)",
    tolerance: "Allowed tolerance (KG)",
    save: "Save",
  },
  ar: {
    language: "English",
    overview: "نظرة عامة",
    athletes: "اللاعبون",
    registrations: "التسجيلات",
    weighIn: "الميزان",
    brackets: "البولات والبراكت",
    scoring: "التحكيم والنقاط",
    results: "النتائج",
    fullScreen: "ملء الشاشة",
    noBelt: "بدون حزام",
    belt: "الحزام",
    expectedWeight: "الوزن المتوقع (كجم)",
    tolerance: "السماح الإضافي (كجم)",
    save: "حفظ",
  },
};

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (key: string) => string }>({
  language: "en",
  setLanguage: () => undefined,
  t: key => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("championship-language") as Language) || "en");
  useEffect(() => {
    localStorage.setItem("championship-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: string) => languageDictionaries[language][key] ?? key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
