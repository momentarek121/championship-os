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
    refereeDesk: "Referee desk",
    runNextMatch: "Run the next match",
    matchQueue: "Match queue",
    digitalTimer: "Digital timer",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    finishAdvance: "Finish match and advance winner",
    fullName: "Full name",
    dateOfBirth: "Date of birth",
    gender: "Gender",
    submitRegistration: "Submit registration",
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
    refereeDesk: "مكتب الحكم",
    runNextMatch: "إدارة المباراة التالية",
    matchQueue: "قائمة المباريات",
    digitalTimer: "التايمر الرقمي",
    start: "بدء",
    pause: "إيقاف مؤقت",
    reset: "إعادة ضبط",
    finishAdvance: "إنهاء المباراة وتأهل الفائز",
    fullName: "الاسم بالكامل",
    dateOfBirth: "تاريخ الميلاد",
    gender: "النوع",
    submitRegistration: "إرسال التسجيل",
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
