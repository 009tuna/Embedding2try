/**
 * Public REST API endpoints authenticated via API key (Bearer token).
 * These endpoints allow external systems (ERP, automation tools) to:
 * - Submit documents for standardization
 * - Process documents
 * - Retrieve matching results
 * - Export data
 */
import { Router, Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import * as db from "./db";
import { extractTermsFromText, semanticMatch, extractTextFromFile } from "./standardization";

const publicApiRouter = Router();

// ─── API Key Authentication Middleware ───
async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "API anahtarı gereklidir. Authorization: Bearer <api_key>" });
  }

  const rawKey = authHeader.substring(7);
  if (!rawKey.startsWith("dds_")) {
    return res.status(401).json({ error: "Geçersiz API anahtarı formatı" });
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const apiKey = await db.getApiKeyByHash(keyHash);

  if (!apiKey) {
    return res.status(401).json({ error: "Geçersiz veya devre dışı API anahtarı" });
  }

  // Attach userId to request for downstream use
  (req as any).apiUserId = apiKey.userId;
  (req as any).apiKeyId = apiKey.id;
  next();
}

publicApiRouter.use(authenticateApiKey);

// ─── POST /api/v1/documents - Submit a document ───
publicApiRouter.post("/documents", async (req: Request, res: Response) => {
  try {
    const { title, sourceType, rawContent, supplierName } = req.body;

    if (!title || !rawContent) {
      return res.status(400).json({ error: "title ve rawContent alanları zorunludur" });
    }

    const validTypes = ["email", "waybill", "invoice", "order_note", "customs", "price_quote", "other"];
    const docType = validTypes.includes(sourceType) ? sourceType : "other";

    const doc = await db.createDocument({
      userId: (req as any).apiUserId,
      title,
      sourceType: docType,
      rawContent,
      supplierName: supplierName || null,
      fileName: null,
      status: "pending",
      metadata: null,
      fileUrl: null,
      fileKey: null,
      mimeType: null,
    });

    await db.createProcessingLog({
      userId: (req as any).apiUserId,
      documentId: doc.id,
      action: "document_uploaded_via_api",
      details: { title, sourceType: docType },
      status: "success",
    });

    return res.status(201).json({ success: true, documentId: doc.id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/v1/documents/:id/process - Process a document ───
publicApiRouter.post("/documents/:id/process", async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id);
    const userId = (req as any).apiUserId;

    const doc = await db.getDocumentById(docId, userId);
    if (!doc) return res.status(404).json({ error: "Belge bulunamadı" });

    if (doc.status === "processing") {
      return res.status(409).json({ error: "Bu belge şu anda işleniyor" });
    }

    if (!doc.rawContent || doc.rawContent.trim().length === 0) {
      return res.status(400).json({ error: "Belge içeriği boş" });
    }

    // Idempotent: delete old results
    if (doc.status === "completed" || doc.status === "failed") {
      await db.deleteMatchingResultsByDocument(docId, userId);
    }

    await db.updateDocument(docId, userId, { status: "processing" });

    const extractedTerms = await extractTermsFromText(doc.rawContent);
    const categories = await db.getCategories(userId);
    const rules = await db.getMatchingRules(userId);
    const matchResults = await semanticMatch(extractedTerms, categories, rules);

    if (matchResults.length > 0) {
      await db.createMatchingResults(
        matchResults.map(r => ({
          documentId: docId,
          userId,
          extractedTerm: r.extractedTerm,
          matchedCategoryId: r.matchedCategoryId,
          matchedCategoryName: r.matchedCategoryName,
          confidenceScore: r.confidenceScore,
          matchType: r.matchType,
          erpField: r.erpField,
          standardizedValue: r.standardizedValue,
          llmExplanation: r.llmExplanation,
          isApproved: false,
        }))
      );
    }

    await db.updateDocument(docId, userId, {
      status: "completed",
      processedAt: new Date(),
      metadata: { termsExtracted: extractedTerms.length, matchesFound: matchResults.length },
    });

    await db.createProcessingLog({
      userId,
      documentId: docId,
      action: "document_processed_via_api",
      details: { termsExtracted: extractedTerms.length, matchesFound: matchResults.length },
      status: "success",
    });

    return res.json({
      success: true,
      termsExtracted: extractedTerms.length,
      matchesFound: matchResults.length,
      results: matchResults,
    });
  } catch (e: any) {
    const docId = parseInt(req.params.id);
    const userId = (req as any).apiUserId;
    try { await db.updateDocument(docId, userId, { status: "failed" }); } catch {}
    return res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/v1/documents/:id/results - Get matching results ───
publicApiRouter.get("/documents/:id/results", async (req: Request, res: Response) => {
  try {
    const docId = parseInt(req.params.id);
    const userId = (req as any).apiUserId;
    const results = await db.getMatchingResultsByDocument(docId, userId);
    return res.json({ success: true, results });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/v1/standardize - One-shot: submit + process in one call ───
publicApiRouter.post("/standardize", async (req: Request, res: Response) => {
  try {
    const { title, sourceType, rawContent, supplierName } = req.body;
    const userId = (req as any).apiUserId;

    if (!rawContent) {
      return res.status(400).json({ error: "rawContent alanı zorunludur" });
    }

    const validTypes = ["email", "waybill", "invoice", "order_note", "customs", "price_quote", "other"];
    const docType = validTypes.includes(sourceType) ? sourceType : "other";

    // Create document
    const doc = await db.createDocument({
      userId,
      title: title || "API Standardization",
      sourceType: docType,
      rawContent,
      supplierName: supplierName || null,
      fileName: null,
      status: "processing",
      metadata: null,
      fileUrl: null,
      fileKey: null,
      mimeType: null,
    });

    // Process immediately
    const extractedTerms = await extractTermsFromText(rawContent);
    const categories = await db.getCategories(userId);
    const rules = await db.getMatchingRules(userId);
    const matchResults = await semanticMatch(extractedTerms, categories, rules);

    if (matchResults.length > 0) {
      await db.createMatchingResults(
        matchResults.map(r => ({
          documentId: doc.id,
          userId,
          extractedTerm: r.extractedTerm,
          matchedCategoryId: r.matchedCategoryId,
          matchedCategoryName: r.matchedCategoryName,
          confidenceScore: r.confidenceScore,
          matchType: r.matchType,
          erpField: r.erpField,
          standardizedValue: r.standardizedValue,
          llmExplanation: r.llmExplanation,
          isApproved: false,
        }))
      );
    }

    await db.updateDocument(doc.id, userId, {
      status: "completed",
      processedAt: new Date(),
      metadata: { termsExtracted: extractedTerms.length, matchesFound: matchResults.length },
    });

    await db.createProcessingLog({
      userId,
      documentId: doc.id,
      action: "document_standardized_via_api",
      details: { termsExtracted: extractedTerms.length, matchesFound: matchResults.length },
      status: "success",
    });

    return res.json({
      success: true,
      documentId: doc.id,
      termsExtracted: extractedTerms.length,
      matchesFound: matchResults.length,
      results: matchResults,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/v1/categories - List categories ───
publicApiRouter.get("/categories", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).apiUserId;
    const type = req.query.type as string | undefined;
    const categories = await db.getCategories(userId, type);
    return res.json({ success: true, categories });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export { publicApiRouter };
