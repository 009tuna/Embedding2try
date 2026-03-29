import { invokeLLM } from "./_core/llm";
import type { ErpCategory, MatchingRule } from "../drizzle/schema";

export interface ExtractedTerm {
  term: string;
  context: string;
  fieldType: string;
}

export interface MatchResult {
  extractedTerm: string;
  matchedCategoryId: number | null;
  matchedCategoryName: string | null;
  confidenceScore: number;
  matchType: "semantic" | "rule" | "exact" | "manual";
  erpField: string | null;
  standardizedValue: string | null;
  llmExplanation: string | null;
}

/**
 * Extract structured terms from raw logistics text using LLM
 */
export async function extractTermsFromText(rawText: string): Promise<ExtractedTerm[]> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Sen bir lojistik ve tedarik zinciri veri analisti olarak görev yapıyorsun. 
Sana verilen serbest metinlerden (e-posta, irsaliye, sipariş notu, gümrük beyannamesi vb.) yapılandırılmış terimleri çıkar.

Her terim için şunları belirle:
- term: Çıkarılan terim/ifade
- context: Terimin bağlamı (cümle veya paragraf)
- fieldType: Terimin ait olduğu alan tipi (expense, operation, material, route, supplier, custom)

Lojistik terminolojisini, kısaltmaları ve farklı dillerdeki karşılıkları anla.
Örneğin: "FOB", "CIF", "milk run", "cross-dock", "LTL", "FTL", "demuraj", "ardiye" gibi terimleri tanı.`
      },
      {
        role: "user",
        content: `Aşağıdaki metinden yapılandırılmış terimleri çıkar:\n\n${rawText}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "extracted_terms",
        strict: true,
        schema: {
          type: "object",
          properties: {
            terms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  term: { type: "string", description: "Çıkarılan terim" },
                  context: { type: "string", description: "Terimin bağlamı" },
                  fieldType: { type: "string", enum: ["expense", "operation", "material", "route", "supplier", "custom"], description: "Alan tipi" }
                },
                required: ["term", "context", "fieldType"],
                additionalProperties: false
              }
            }
          },
          required: ["terms"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") return [];
  
  try {
    const parsed = JSON.parse(content);
    return parsed.terms || [];
  } catch {
    return [];
  }
}

/**
 * Apply user-defined matching rules first (exact, contains, regex)
 */
export function applyRules(term: string, rules: MatchingRule[], categories: ErpCategory[]): MatchResult | null {
  const sortedRules = [...rules].filter(r => r.isActive).sort((a, b) => b.priority - a.priority);
  
  for (const rule of sortedRules) {
    let matched = false;
    const lowerTerm = term.toLowerCase();
    const lowerPattern = rule.sourcePattern.toLowerCase();

    switch (rule.matchStrategy) {
      case "exact":
        matched = lowerTerm === lowerPattern;
        break;
      case "contains":
        matched = lowerTerm.includes(lowerPattern) || lowerPattern.includes(lowerTerm);
        break;
      case "regex":
        try {
          const regex = new RegExp(rule.sourcePattern, "i");
          matched = regex.test(term);
        } catch { matched = false; }
        break;
      case "semantic":
        // Semantic rules are handled by the LLM matching below
        break;
    }

    if (matched) {
      const category = categories.find(c => c.id === rule.targetCategoryId);
      if (category) {
        return {
          extractedTerm: term,
          matchedCategoryId: category.id,
          matchedCategoryName: category.name,
          confidenceScore: 0.95,
          matchType: "rule",
          erpField: category.erpField,
          standardizedValue: category.name,
          llmExplanation: `Kural eşleştirmesi: "${rule.name}" kuralı uygulandı (strateji: ${rule.matchStrategy})`,
        };
      }
    }
  }
  return null;
}

/**
 * Semantic matching using LLM - matches extracted terms to ERP categories
 */
export async function semanticMatch(
  terms: ExtractedTerm[],
  categories: ErpCategory[],
  rules: MatchingRule[]
): Promise<MatchResult[]> {
  if (terms.length === 0) return [];

  const results: MatchResult[] = [];

  // First pass: apply rules
  const unmatchedTerms: ExtractedTerm[] = [];
  for (const t of terms) {
    const ruleResult = applyRules(t.term, rules, categories);
    if (ruleResult) {
      results.push(ruleResult);
    } else {
      unmatchedTerms.push(t);
    }
  }

  // Second pass: LLM semantic matching for unmatched terms
  if (unmatchedTerms.length > 0 && categories.length > 0) {
    const categoryList = categories.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      description: c.description,
      erpField: c.erpField,
    }));

    const termList = unmatchedTerms.map(t => ({
      term: t.term,
      context: t.context,
      fieldType: t.fieldType,
    }));

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Sen bir lojistik veri standardizasyon uzmanısın. Sana verilen terimleri, mevcut ERP kategorileriyle eşleştir.

Her terim için:
1. En uygun ERP kategorisini bul
2. Güven skoru ver (0.0 - 1.0 arası)
3. Neden bu eşleştirmeyi yaptığını açıkla
4. Standartlaştırılmış değeri belirle

Lojistik terminolojisini, kısaltmaları, farklı dillerdeki karşılıkları ve anlamsal benzerlikleri dikkate al.
Örneğin: "Yurt içi nakliye bedeli" ve "Milk run operasyon maliyeti" aynı gider kalemine ait olabilir.
"FOB Shanghai" bir rota/tedarik noktası olabilir.
"Demuraj ücreti" bir gider kalemi olabilir.

Eğer hiçbir kategori uygun değilse, categoryId olarak null ver ve güven skorunu düşük tut.`
        },
        {
          role: "user",
          content: JSON.stringify({ terms: termList, categories: categoryList })
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "matching_results",
          strict: true,
          schema: {
            type: "object",
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    term: { type: "string" },
                    categoryId: { type: ["integer", "null"] },
                    categoryName: { type: ["string", "null"] },
                    confidenceScore: { type: "number" },
                    erpField: { type: ["string", "null"] },
                    standardizedValue: { type: ["string", "null"] },
                    explanation: { type: "string" }
                  },
                  required: ["term", "categoryId", "categoryName", "confidenceScore", "erpField", "standardizedValue", "explanation"],
                  additionalProperties: false
                }
              }
            },
            required: ["matches"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (content && typeof content === "string") {
      try {
        const parsed = JSON.parse(content);
        for (const match of (parsed.matches || [])) {
          results.push({
            extractedTerm: match.term,
            matchedCategoryId: match.categoryId,
            matchedCategoryName: match.categoryName,
            confidenceScore: Math.min(1, Math.max(0, match.confidenceScore)),
            matchType: "semantic",
            erpField: match.erpField,
            standardizedValue: match.standardizedValue,
            llmExplanation: match.explanation,
          });
        }
      } catch (e) {
        // If LLM response parsing fails, create unmatched results
        for (const t of unmatchedTerms) {
          results.push({
            extractedTerm: t.term,
            matchedCategoryId: null,
            matchedCategoryName: null,
            confidenceScore: 0,
            matchType: "semantic",
            erpField: null,
            standardizedValue: null,
            llmExplanation: "Eşleştirme sırasında hata oluştu",
          });
        }
      }
    }
  } else if (unmatchedTerms.length > 0) {
    // No categories defined yet
    for (const t of unmatchedTerms) {
      results.push({
        extractedTerm: t.term,
        matchedCategoryId: null,
        matchedCategoryName: null,
        confidenceScore: 0,
        matchType: "semantic",
        erpField: null,
        standardizedValue: null,
        llmExplanation: "Henüz ERP kategorisi tanımlanmamış. Lütfen kategori ekleyin.",
      });
    }
  }

  return results;
}

/**
 * Parse email content and extract structured logistics data
 */
export async function parseEmailContent(emailBody: string): Promise<{
  sender: string | null;
  subject: string | null;
  documentType: string;
  extractedData: Record<string, string>;
  summary: string;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Sen bir lojistik e-posta ayrıştırma uzmanısın. Gelen e-posta içeriğini analiz et ve yapılandırılmış veri çıkar.

Belge tipini belirle: email, waybill, invoice, order_note, customs, price_quote, other
Tedarikçi/gönderici bilgisini, konu satırını ve önemli verileri çıkar.`
      },
      {
        role: "user",
        content: emailBody
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "parsed_email",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sender: { type: ["string", "null"] },
            subject: { type: ["string", "null"] },
            documentType: { type: "string", enum: ["email", "waybill", "invoice", "order_note", "customs", "price_quote", "other"] },
            extractedData: {
              type: "object",
              additionalProperties: { type: "string" }
            },
            summary: { type: "string" }
          },
          required: ["sender", "subject", "documentType", "extractedData", "summary"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (content && typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {}
  }
  
  return {
    sender: null,
    subject: null,
    documentType: "other",
    extractedData: {},
    summary: "E-posta içeriği ayrıştırılamadı"
  };
}
