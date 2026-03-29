import { describe, expect, it, vi } from "vitest";
import { applyRules, type MatchResult } from "./standardization";
import type { ErpCategory, MatchingRule } from "../drizzle/schema";

// Mock categories
const mockCategories: ErpCategory[] = [
  {
    id: 1, userId: 1, type: "expense", code: "GDR-001", name: "Yurt İçi Nakliye Gideri",
    description: "Yurt içi nakliye ve taşıma giderleri", parentId: null, erpField: "gider_nakliye_yurtici",
    isActive: true, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 2, userId: 1, type: "expense", code: "GDR-002", name: "Demuraj Ücreti",
    description: "Konteyner bekleme ücreti", parentId: null, erpField: "gider_demuraj",
    isActive: true, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 3, userId: 1, type: "operation", code: "OPR-001", name: "Milk Run Operasyonu",
    description: "Milk run toplama operasyonu", parentId: null, erpField: "operasyon_milkrun",
    isActive: true, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 4, userId: 1, type: "material", code: "MAT-001", name: "Çelik Sac",
    description: "Soğuk haddelenmiş çelik sac", parentId: null, erpField: "malzeme_celik_sac",
    isActive: true, createdAt: new Date(), updatedAt: new Date(),
  },
];

// Mock rules
const mockRules: MatchingRule[] = [
  {
    id: 1, userId: 1, name: "Nakliye Bedeli Kuralı", description: "Nakliye ile ilgili terimleri yakala",
    sourcePattern: "nakliye bedeli", targetCategoryId: 1, matchStrategy: "contains",
    priority: 10, isActive: true, timesApplied: 0, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 2, userId: 1, name: "Demuraj Kuralı", description: "Demuraj terimleri",
    sourcePattern: "demuraj", targetCategoryId: 2, matchStrategy: "contains",
    priority: 5, isActive: true, timesApplied: 0, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 3, userId: 1, name: "Milk Run Regex", description: null,
    sourcePattern: "milk\\s*run", targetCategoryId: 3, matchStrategy: "regex",
    priority: 8, isActive: true, timesApplied: 0, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 4, userId: 1, name: "Tam Eşleşme Testi", description: null,
    sourcePattern: "çelik sac", targetCategoryId: 4, matchStrategy: "exact",
    priority: 15, isActive: true, timesApplied: 0, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 5, userId: 1, name: "Pasif Kural", description: null,
    sourcePattern: "test", targetCategoryId: 1, matchStrategy: "contains",
    priority: 20, isActive: false, timesApplied: 0, createdAt: new Date(), updatedAt: new Date(),
  },
];

describe("applyRules - Rule-based matching engine", () => {
  it("matches 'contains' strategy correctly", () => {
    const result = applyRules("Yurt içi nakliye bedeli", mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result!.matchedCategoryId).toBe(1);
    expect(result!.matchedCategoryName).toBe("Yurt İçi Nakliye Gideri");
    expect(result!.matchType).toBe("rule");
    expect(result!.confidenceScore).toBe(0.95);
    expect(result!.erpField).toBe("gider_nakliye_yurtici");
  });

  it("matches 'contains' strategy case-insensitively", () => {
    const result = applyRules("NAKLIYE BEDELI toplam", mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result!.matchedCategoryId).toBe(1);
  });

  it("matches 'exact' strategy correctly", () => {
    const result = applyRules("çelik sac", mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result!.matchedCategoryId).toBe(4);
    expect(result!.matchedCategoryName).toBe("Çelik Sac");
  });

  it("does not match 'exact' strategy for partial matches", () => {
    const result = applyRules("soğuk haddelenmiş çelik sac levha", mockRules, mockCategories);
    // "exact" won't match, but "contains" for demuraj won't match either
    // The exact rule requires full string match
    // However, "contains" rule for nakliye won't match this term
    // So it should return null or match via another rule
    // Actually, none of the contains rules match "çelik sac levha"
    // The exact rule needs exact match "çelik sac" === "soğuk haddelenmiş çelik sac levha" which is false
    expect(result).toBeNull();
  });

  it("matches 'regex' strategy correctly", () => {
    const result = applyRules("Milk Run operasyon maliyeti", mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result!.matchedCategoryId).toBe(3);
    expect(result!.matchedCategoryName).toBe("Milk Run Operasyonu");
  });

  it("matches regex with flexible whitespace", () => {
    const result = applyRules("milkrun toplama", mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result!.matchedCategoryId).toBe(3);
  });

  it("skips inactive rules", () => {
    const result = applyRules("test terimi", mockRules, mockCategories);
    // Rule 5 is inactive, so it should not match
    expect(result).toBeNull();
  });

  it("returns null for unmatched terms", () => {
    const result = applyRules("bilinmeyen terim xyz", mockRules, mockCategories);
    expect(result).toBeNull();
  });

  it("respects priority ordering", () => {
    // "demuraj nakliye bedeli" should match "nakliye bedeli" (priority 10) over "demuraj" (priority 5)
    const result = applyRules("demuraj nakliye bedeli", mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result!.matchedCategoryId).toBe(1); // nakliye bedeli has higher priority
  });

  it("handles empty rules array", () => {
    const result = applyRules("nakliye bedeli", [], mockCategories);
    expect(result).toBeNull();
  });

  it("handles empty categories array", () => {
    const result = applyRules("nakliye bedeli", mockRules, []);
    // Rule matches but category not found
    expect(result).toBeNull();
  });

  it("returns correct structure for matched results", () => {
    const result = applyRules("demuraj ücreti", mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("extractedTerm", "demuraj ücreti");
    expect(result).toHaveProperty("matchedCategoryId");
    expect(result).toHaveProperty("matchedCategoryName");
    expect(result).toHaveProperty("confidenceScore");
    expect(result).toHaveProperty("matchType");
    expect(result).toHaveProperty("erpField");
    expect(result).toHaveProperty("standardizedValue");
    expect(result).toHaveProperty("llmExplanation");
  });
});

describe("applyRules - Edge cases", () => {
  it("handles special characters in terms", () => {
    const result = applyRules("nakliye bedeli (KDV dahil)", mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result!.matchedCategoryId).toBe(1);
  });

  it("handles empty string term", () => {
    // Empty/whitespace terms are now guarded and return null immediately
    const result = applyRules("", mockRules, mockCategories);
    expect(result).toBeNull();

    const whitespaceResult = applyRules("   ", mockRules, mockCategories);
    expect(whitespaceResult).toBeNull();
  });

  it("handles very long terms", () => {
    const longTerm = "Bu çok uzun bir terim ve içinde nakliye bedeli geçiyor ama çok uzun bir cümle " + "a".repeat(500);
    const result = applyRules(longTerm, mockRules, mockCategories);
    expect(result).not.toBeNull();
    expect(result!.matchedCategoryId).toBe(1);
  });

  it("handles invalid regex gracefully", () => {
    const badRules: MatchingRule[] = [{
      id: 99, userId: 1, name: "Bad Regex", description: null,
      sourcePattern: "[invalid(regex", targetCategoryId: 1, matchStrategy: "regex",
      priority: 100, isActive: true, timesApplied: 0, createdAt: new Date(), updatedAt: new Date(),
    }];
    const result = applyRules("test", badRules, mockCategories);
    expect(result).toBeNull(); // Should not throw, just skip
  });
});
