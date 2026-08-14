import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Language = "en" | "ar";
type Dictionary = Record<string, string>;

export const languageDictionaries: Record<Language, Dictionary> = {
  en: {
    language: "العربية", overview: "Overview", athletes: "Athletes", registrations: "Registrations", weighIn: "Weigh-in", brackets: "Brackets", scoring: "Scoring", results: "Results", fullScreen: "Full screen", noBelt: "No belt", belt: "Belt", expectedWeight: "Expected weight (KG)", tolerance: "Allowed tolerance (KG)", refereeDesk: "Referee desk", runNextMatch: "Run the next match", matchQueue: "Match queue", digitalTimer: "Digital timer", start: "Start", pause: "Pause", reset: "Reset", finishAdvance: "Finish match and advance winner", fullName: "Full name", dateOfBirth: "Date of birth", gender: "Gender", submitRegistration: "Submit registration", save: "Save",
  },
  ar: {
    language: "English", overview: "نظرة عامة", athletes: "اللاعبون", registrations: "التسجيلات", weighIn: "الميزان", brackets: "البولات والبراكت", scoring: "التحكيم والنقاط", results: "النتائج", fullScreen: "ملء الشاشة", noBelt: "بدون حزام", belt: "الحزام", expectedWeight: "الوزن المتوقع (كجم)", tolerance: "السماح الإضافي (كجم)", refereeDesk: "مكتب الحكم", runNextMatch: "إدارة المباراة التالية", matchQueue: "قائمة المباريات", digitalTimer: "التايمر الرقمي", start: "بدء", pause: "إيقاف مؤقت", reset: "إعادة ضبط", finishAdvance: "إنهاء المباراة وتأهل الفائز", fullName: "الاسم بالكامل", dateOfBirth: "تاريخ الميلاد", gender: "النوع", submitRegistration: "إرسال التسجيل", save: "حفظ",
  },
};

export const arabicReplacements: Record<string, string> = {
  "Championship OS": "منصة البطولات", "Simple tournament control": "إدارة بسيطة للبطولات", "Tournament setup": "إعداد البطولة", "Create your tournament": "أنشئ بطولتك", "Set up your first tournament": "إعداد أول بطولة", "Create the event first, then share the registration link with athletes.": "أنشئ البطولة أولاً ثم شارك رابط التسجيل مع اللاعبين.", "Run of show": "خطة التشغيل", "Organizer checklist": "قائمة المنظم", "Register athletes": "تسجيل اللاعبين", "Approve & weigh in": "اعتماد ووزن اللاعبين", "Build brackets": "إنشاء البراكت", "Score matches": "تحكيم المباريات", "Add athlete": "إضافة لاعب", "Athlete desk": "إدارة اللاعبين", "Registration desk": "إدارة التسجيلات", "Use one click to approve, check in, and mark payment.": "استخدم ضغطة واحدة للاعتماد وتسجيل الحضور والدفع.",
  "IBJJF weigh-in": "ميزان النظام القياسي", "Weigh-in queue": "قائمة انتظار الميزان", "Brackets & mats": "البراكت والبسط", "Generate automatically, then edit manually before publishing.": "أنشئ البراكت تلقائياً ثم عدّلها يدوياً قبل النشر.", "Generate automatic brackets": "إنشاء البراكت تلقائياً", "Manual pairing": "توزيع يدوي", "Add manual match": "إضافة مباراة يدوية", "Live pool and mat board": "لوحة البولات والبسط المباشرة", "Medal results": "نتائج الميداليات", "Academy standings": "ترتيب الأكاديميات", "No results recorded": "لا توجد نتائج مسجلة", "Save setup": "حفظ الإعدادات", "Save decision": "حفظ القرار", "Approve & queue": "اعتماد وإضافة للقائمة", "Mark paid": "تسجيل الدفع", "Check in": "تسجيل الحضور", "Save slots": "حفظ الأماكن", "Save athlete": "حفظ اللاعب", "Queued": "قائمة الانتظار", "Live": "جارية", "Completed": "مكتملة", "No-show": "غياب", "queued": "قائمة الانتظار", "live": "جارية", "finished": "مكتملة", "no_show": "غياب",
  "Round of 16": "دور الـ16", "Quarterfinal": "ربع النهائي", "Semifinal": "نصف النهائي", "Final": "النهائي", "Gold": "ذهبية", "Silver": "فضية", "Bronze": "برونزية", "Registered": "المسجلون", "Paid": "المدفوع", "Checked in": "تم الحضور", "Live matches": "المباريات الجارية", "No tournament yet": "لا توجد بطولة بعد", "No athletes yet": "لا يوجد لاعبون بعد", "No matches generated": "لم يتم إنشاء مباريات بعد", "No mats configured": "لا توجد بسط مهيأة", "No live matches": "لا توجد مباريات جارية", "No unfinished matches are published yet.": "لا توجد مباريات غير مكتملة منشورة بعد.", "No match selected": "لم يتم اختيار مباراة", "Select a queued match to begin.": "اختر مباراة من القائمة للبدء.",
  "Organization name": "اسم المنظمة", "Scale and belt policy notes": "ملاحظات الميزان وسياسة الأحزمة", "IBJJF standard": "النظام القياسي", "Custom tolerance": "سماح مخصص", "Competition mode": "نظام المنافسة", "GI": "جي", "No-Gi": "بدون بدلة", "Both · GI + No-Gi": "كلاهما · جي وبدون بدلة", "Tolerance KG": "السماح بالكيلو", "Custom organization rule": "قاعدة مخصصة للمنظمة", "Save IBJJF standard (0.00 KG)": "حفظ النظام القياسي (0.00 كجم)", "Save custom tolerance": "حفظ السماح المخصص", "Exact KG": "الوزن الدقيق بالكيلو", "Pass": "اجتياز", "Overweight": "زيادة عن الوزن", "Status": "الحالة", "Limit": "الحد", "Recorded": "المسجل", "Difference": "الفرق", "Search athlete name": "البحث باسم اللاعب", "Filter belt": "تصفية حسب الحزام", "All belts": "كل الأحزمة", "Filter weight category": "تصفية حسب فئة الوزن", "All weight categories": "كل فئات الوزن", "Showing": "عرض", "of": "من",
  "Copy registration link": "نسخ رابط التسجيل", "View participants": "عرض المشاركين", "Load demo data": "تحميل بيانات تجريبية", "New tournament": "بطولة جديدة", "Create tournament": "إنشاء بطولة", "Create and get registration link": "إنشاء والحصول على رابط التسجيل", "Quick athlete registration": "تسجيل لاعب سريع", "Male": "ذكر", "Female": "أنثى", "Weight in KG": "الوزن بالكيلو", "Tournament name": "اسم البطولة", "Location": "الموقع", "Sport": "الرياضة", "Ruleset e.g. IBJJF Standard": "نظام البطولة، مثال: النظام القياسي", "Divisions, separated by commas": "الفئات مفصولة بفواصل", "Number of mats": "عدد البسط", "Weight tolerance in KG": "السماح بالوزن بالكيلو", "Full name": "الاسم بالكامل", "Email": "البريد الإلكتروني", "Phone": "الهاتف", "Date of birth": "تاريخ الميلاد", "Athlete A": "اللاعب أ", "Athlete B": "اللاعب ب", "Empty slot": "مكان فارغ", "Save result": "حفظ النتيجة", "Result saved": "تم حفظ النتيجة", "Result saved and winner advanced": "تم حفظ النتيجة وتأهل الفائز", "Tournament created": "تم إنشاء البطولة", "Tournament settings saved": "تم حفظ إعدادات البطولة", "Weigh-in settings saved": "تم حفظ إعدادات الميزان", "Registration link copied": "تم نسخ رابط التسجيل", "Academy standings CSV downloaded": "تم تنزيل ملف ترتيب الأكاديميات CSV", "Academy standings PDF downloaded": "تم تنزيل ملف ترتيب الأكاديميات PDF", "CSV": "CSV", "PDF": "PDF", "Download": "تنزيل",
  "Run the next match": "إدارة المباراة التالية", "Back to organizer": "العودة إلى المنظم", "Organizer access required": "يتطلب صلاحية المنظم", "Select a live queue match, control the timer, record scores, and publish the winner to the next round.": "اختر مباراة من القائمة، تحكم في الوقت، سجل النقاط، وانشر الفائز إلى الدور التالي.", "Athlete Portal": "بوابة اللاعب", "Your tournament, at a glance.": "كل تفاصيل بطولتك في شاشة واحدة.", "Enter the accreditation code you received after registration. No account or password is needed.": "أدخل كود الاعتماد الذي حصلت عليه بعد التسجيل. لا تحتاج إلى حساب أو كلمة مرور.", "Find my status": "اعرف حالتي", "Show my status": "عرض حالتي", "Next match": "المباراة التالية", "Bracket history": "سجل البراكت", "Time TBA": "الوقت يحدد لاحقاً", "Pending assignment": "بانتظار التحديد", "Registration": "التسجيل", "Weigh-in": "الميزان", "No bracket match has been published yet.": "لم يتم نشر مباراة في البراكت بعد.", "Your next match has not been published yet.": "لم يتم نشر مباراتك التالية بعد.",
  "Referee desk": "مكتب الحكم", "Digital match timer": "تايمر المباراة الرقمي", "Minutes": "الدقائق", "Start": "بدء", "Start again": "بدء من جديد", "Pause": "إيقاف مؤقت", "Reset": "إعادة ضبط", "Full screen": "ملء الشاشة", "Match queue": "قائمة المباريات", "Call the match, score it, choose the winner, and the result is recorded.": "ابدأ المباراة، سجل النقاط، اختر الفائز، وسيتم حفظ النتيجة.", "Finish match and advance winner": "إنهاء المباراة وتأهل الفائز", "+1 point": "+1 نقطة", "Advantage": "أفضلية", "Penalty": "مخالفة", "Referee evaluation / decision note": "ملاحظة الحكم أو القرار", "Awaiting athlete": "بانتظار اللاعب",
  "Registration open": "التسجيل مفتوح", "Custom weigh-in rules": "قواعد وزن مخصصة", "Brazilian Jiu-Jitsu": "الجوجيتسو البرازيلية", "Submit registration": "إرسال التسجيل", "Registration submitted": "تم إرسال التسجيل", "Your accreditation code": "كود الاعتماد الخاص بك", "Open registration": "فتح التسجيل", "Open demo brackets": "فتح البراكت التجريبي", "Open demo participants": "فتح المشاركين التجريبيين", "Read-only demo match": "مباراة تجريبية للعرض فقط", "Demo scoring controls disabled": "أدوات التسجيل التجريبية غير متاحة",
  "Tournament": "البطولة", "Category": "الفئة", "Mat": "بساط", "Queue": "القائمة", "Starts": "تبدأ", "Est. end": "النهاية المتوقعة", "Match": "مباراة", "remaining": "متبقية", "athletes": "لاعبين", "matches total": "إجمالي المباريات", "Payment status": "حالة الدفع", "No account or password is needed.": "لا تحتاج إلى حساب أو كلمة مرور.", "Sign out": "تسجيل الخروج", "Sign in to start": "سجل الدخول للبدء", "Run your tournament simply.": "أدر بطولتك بسهولة.", "Registration, weigh-in, brackets, mats, scoring, and results in one place.": "التسجيل والميزان والبراكت والبسط والتحكيم والنتائج في مكان واحد.", "Workspace unavailable": "مساحة العمل غير متاحة", "Could not load tournament data": "تعذر تحميل بيانات البطولة", "Refresh the page or check the server database configuration before retrying.": "أعد تحميل الصفحة أو تحقق من إعدادات قاعدة البيانات قبل إعادة المحاولة.", "Retry": "إعادة المحاولة", "Loading…": "جار التحميل…",
};

const originalTextValues = new WeakMap<Text, string>();
const originalAttributeValues = new WeakMap<Element, Record<string, string>>();
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (key: string) => string }>({ language: "en", setLanguage: () => undefined, t: key => key });

function translateValue(value: string, language: Language) {
  if (language === "en") return value;
  let translated = value;
  Object.entries(arabicReplacements).forEach(([english, arabic]) => { translated = translated.replaceAll(english, arabic); });
  return translated;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("championship-language") as Language) || "en");
  useEffect(() => {
    localStorage.setItem("championship-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    const translate = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (!parent || ["SCRIPT", "STYLE"].includes(parent.tagName)) continue;
        if (!originalTextValues.has(textNode)) originalTextValues.set(textNode, textNode.nodeValue ?? "");
        textNode.nodeValue = translateValue(originalTextValues.get(textNode) ?? "", language);
      }
      document.querySelectorAll<HTMLElement>("input, textarea, button, [title], [aria-label]").forEach(element => {
        const saved = originalAttributeValues.get(element) ?? {};
        ["placeholder", "title", "aria-label"].forEach(attribute => {
          const value = element.getAttribute(attribute);
          if (value !== null && saved[attribute] === undefined) saved[attribute] = value;
          if (saved[attribute] !== undefined) element.setAttribute(attribute, translateValue(saved[attribute], language));
        });
        originalAttributeValues.set(element, saved);
      });
    };
    translate();
    const observer = new MutationObserver(translate);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: string) => language === "ar" ? arabicReplacements[key] ?? languageDictionaries.ar[key] ?? key : languageDictionaries.en[key] ?? key }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
