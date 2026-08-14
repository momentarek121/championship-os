import { describe, expect, it } from "vitest";
import { languageDictionaries } from "../client/src/contexts/LanguageContext";

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
});
