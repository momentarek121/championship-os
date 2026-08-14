import { describe, expect, it } from "vitest";
import { arabicReplacements, languageDictionaries } from "../client/src/contexts/LanguageContext";

describe("language dictionary", () => {
  it("keeps the core tournament keys available in Arabic and English", () => {
    const keys = ["language", "overview", "athletes", "registrations", "weighIn", "brackets", "scoring", "results", "fullScreen", "noBelt", "tolerance"];
    for (const key of keys) {
      expect(languageDictionaries.en[key]).toBeTruthy();
      expect(languageDictionaries.ar[key]).toBeTruthy();
    }
  });

  it("uses Arabic labels for the Arabic switch and no-belt option", () => {
    expect(languageDictionaries.ar.language).toBe("English");
    expect(languageDictionaries.ar.noBelt).toBe("بدون حزام");
    expect(languageDictionaries.ar.fullScreen).toBe("ملء الشاشة");
  });

  it("covers full-interface copy beyond navigation titles", () => {
    expect(arabicReplacements["Save setup"]).toBe("حفظ الإعدادات");
    expect(arabicReplacements["Search athlete name"]).toBe("البحث باسم اللاعب");
    expect(arabicReplacements["Completed"]).toBe("مكتملة");
    expect(arabicReplacements["Academy standings PDF downloaded"]).toBe("تم تنزيل ملف ترتيب الأكاديميات PDF");
    expect(arabicReplacements["Submit registration"]).toBe("إرسال التسجيل");
  });
});
