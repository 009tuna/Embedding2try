import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { extractTermsFromText, semanticMatch, parseEmailContent } from "./standardization";
import { nanoid } from "nanoid";
import { createHash } from "crypto";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ───────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
    recentActivity: protectedProcedure.query(async ({ ctx }) => {
      return db.getRecentActivity(ctx.user.id, 15);
    }),
  }),

  // ─── ERP Categories ─────────────────────────────────
  categories: router({
    list: protectedProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getCategories(ctx.user.id, input?.type);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getCategoryById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["expense", "operation", "material", "route", "supplier", "custom"]),
        code: z.string().min(1).max(64),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        parentId: z.number().optional(),
        erpField: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createCategory({ ...input, userId: ctx.user.id, parentId: input.parentId ?? null, description: input.description ?? null, erpField: input.erpField ?? null });
        await db.createProcessingLog({ userId: ctx.user.id, action: "category_created", details: { categoryName: input.name, type: input.type }, status: "success" });
        return result;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["expense", "operation", "material", "route", "supplier", "custom"]).optional(),
        code: z.string().min(1).max(64).optional(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().nullable().optional(),
        parentId: z.number().nullable().optional(),
        erpField: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCategory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Documents ───────────────────────────────────────
  documents: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        sourceType: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getDocuments(ctx.user.id, input);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getDocumentById(input.id, ctx.user.id);
      }),
    upload: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        sourceType: z.enum(["email", "waybill", "invoice", "order_note", "customs", "price_quote", "other"]),
        rawContent: z.string().min(1),
        supplierName: z.string().optional(),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const doc = await db.createDocument({
          userId: ctx.user.id,
          title: input.title,
          sourceType: input.sourceType,
          rawContent: input.rawContent,
          supplierName: input.supplierName ?? null,
          fileName: input.fileName ?? null,
          status: "pending",
          metadata: null,
          fileUrl: null,
          fileKey: null,
          mimeType: null,
        });

        await db.createProcessingLog({
          userId: ctx.user.id,
          documentId: doc.id,
          action: "document_uploaded",
          details: { title: input.title, sourceType: input.sourceType },
          status: "success",
        });

        return doc;
      }),
    uploadFile: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        sourceType: z.enum(["email", "waybill", "invoice", "order_note", "customs", "price_quote", "other"]),
        rawContent: z.string().min(1),
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        supplierName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Upload file to S3
        const buffer = Buffer.from(input.fileBase64, "base64");
        const fileKey = `documents/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const doc = await db.createDocument({
          userId: ctx.user.id,
          title: input.title,
          sourceType: input.sourceType,
          rawContent: input.rawContent,
          fileUrl: url,
          fileKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          supplierName: input.supplierName ?? null,
          status: "pending",
          metadata: null,
        });

        await db.createProcessingLog({
          userId: ctx.user.id,
          documentId: doc.id,
          action: "document_uploaded_with_file",
          details: { title: input.title, fileName: input.fileName },
          status: "success",
        });

        return doc;
      }),
    process: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const doc = await db.getDocumentById(input.id, ctx.user.id);
        if (!doc) throw new Error("Belge bulunamadı");

        // Update status to processing
        await db.updateDocument(input.id, ctx.user.id, { status: "processing" });

        try {
          // Step 1: Extract terms from raw text
          const extractedTerms = await extractTermsFromText(doc.rawContent);

          // Step 2: Get user's categories and rules
          const categories = await db.getCategories(ctx.user.id);
          const rules = await db.getMatchingRules(ctx.user.id);

          // Step 3: Semantic matching
          const matchResults = await semanticMatch(extractedTerms, categories, rules);

          // Step 4: Save matching results
          if (matchResults.length > 0) {
            await db.createMatchingResults(
              matchResults.map(r => ({
                documentId: input.id,
                userId: ctx.user.id,
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

          // Step 5: Update document status
          await db.updateDocument(input.id, ctx.user.id, {
            status: "completed",
            processedAt: new Date(),
            metadata: { termsExtracted: extractedTerms.length, matchesFound: matchResults.length },
          });

          await db.createProcessingLog({
            userId: ctx.user.id,
            documentId: input.id,
            action: "document_processed",
            details: { termsExtracted: extractedTerms.length, matchesFound: matchResults.length },
            status: "success",
          });

          return { success: true, termsExtracted: extractedTerms.length, matchesFound: matchResults.length };
        } catch (error: any) {
          await db.updateDocument(input.id, ctx.user.id, { status: "failed" });
          await db.createProcessingLog({
            userId: ctx.user.id,
            documentId: input.id,
            action: "document_processing_failed",
            details: { error: error.message },
            status: "error",
          });
          throw error;
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDocument(input.id, ctx.user.id);
        return { success: true };
      }),
    parseEmail: protectedProcedure
      .input(z.object({ emailContent: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const parsed = await parseEmailContent(input.emailContent);
        return parsed;
      }),
  }),

  // ─── Matching Results ────────────────────────────────
  matching: router({
    byDocument: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getMatchingResultsByDocument(input.documentId, ctx.user.id);
      }),
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        approved: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getMatchingResults(ctx.user.id, input);
      }),
    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.approveMatchingResult(input.id, ctx.user.id);

        // ─── Auto-learning: create a rule from approved semantic matches ───
        try {
          const results = await db.getMatchingResults(ctx.user.id, { limit: 1000 });
          const approved = results.find((r: any) => r.id === input.id);
          if (approved && approved.matchType === "semantic" && approved.matchedCategoryId && approved.confidenceScore >= 0.7) {
            // Check if a similar rule already exists
            const existingRules = await db.getMatchingRules(ctx.user.id);
            const alreadyExists = existingRules.some((r: any) =>
              r.sourcePattern.toLowerCase() === approved.extractedTerm.toLowerCase() &&
              r.targetCategoryId === approved.matchedCategoryId
            );
            if (!alreadyExists) {
              await db.createMatchingRule({
                userId: ctx.user.id,
                name: `Otomatik: ${approved.extractedTerm.substring(0, 50)}`,
                description: `Onaylanan eslestirmeden otomatik olusturuldu (guven: ${(approved.confidenceScore * 100).toFixed(0)}%)`,
                sourcePattern: approved.extractedTerm,
                targetCategoryId: approved.matchedCategoryId,
                matchStrategy: "contains",
                priority: 5,
              });
              await db.createProcessingLog({
                userId: ctx.user.id,
                action: "rule_auto_created",
                details: { term: approved.extractedTerm, categoryId: approved.matchedCategoryId },
                status: "success",
              });
            }
          }
        } catch (e) {
          // Auto-learning failure should not block approval
          console.warn("[AutoLearn] Failed to create rule from approval:", e);
        }

        await db.createProcessingLog({
          userId: ctx.user.id,
          action: "match_approved",
          details: { matchId: input.id },
          status: "success",
        });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        matchedCategoryId: z.number().nullable().optional(),
        matchedCategoryName: z.string().nullable().optional(),
        standardizedValue: z.string().nullable().optional(),
        erpField: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateMatchingResult(id, ctx.user.id, { ...data, matchType: "manual" });
        return { success: true };
      }),
    export: protectedProcedure
      .input(z.object({
        format: z.enum(["json", "csv"]),
        documentId: z.number().optional(),
        approvedOnly: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let results;
        if (input.documentId) {
          results = await db.getMatchingResultsByDocument(input.documentId, ctx.user.id);
        } else {
          results = await db.getMatchingResults(ctx.user.id, { approved: input.approvedOnly });
        }

        if (input.format === "csv") {
          const headers = ["Extracted Term", "Matched Category", "Confidence Score", "Match Type", "ERP Field", "Standardized Value", "Approved", "Explanation"];
          const rows = results.map((r: any) => [
            `"${(r.extractedTerm || "").replace(/"/g, '""')}"`,
            `"${(r.matchedCategoryName || "").replace(/"/g, '""')}"`,
            r.confidenceScore?.toFixed(2) ?? "0",
            r.matchType || "",
            `"${(r.erpField || "").replace(/"/g, '""')}"`,
            `"${(r.standardizedValue || "").replace(/"/g, '""')}"`,
            r.isApproved ? "Yes" : "No",
            `"${(r.llmExplanation || "").replace(/"/g, '""')}"`,
          ].join(","));
          return { data: [headers.join(","), ...rows].join("\n"), format: "csv" as const };
        }

        return { data: JSON.stringify(results, null, 2), format: "json" as const };
      }),
  }),

  // ─── Matching Rules ──────────────────────────────────
  rules: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getMatchingRules(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sourcePattern: z.string().min(1),
        targetCategoryId: z.number(),
        matchStrategy: z.enum(["exact", "contains", "regex", "semantic"]),
        priority: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createMatchingRule({
          ...input,
          userId: ctx.user.id,
          description: input.description ?? null,
          priority: input.priority ?? 0,
        });
        await db.createProcessingLog({
          userId: ctx.user.id,
          action: "rule_created",
          details: { ruleName: input.name },
          status: "success",
        });
        return result;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        sourcePattern: z.string().min(1).optional(),
        targetCategoryId: z.number().optional(),
        matchStrategy: z.enum(["exact", "contains", "regex", "semantic"]).optional(),
        priority: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateMatchingRule(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMatchingRule(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Email Sources ───────────────────────────────────
  emailSources: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getEmailSources(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        emailAddress: z.string().email(),
        sourceType: z.enum(["supplier", "carrier", "customs", "internal", "other"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createEmailSource({ ...input, userId: ctx.user.id });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        emailAddress: z.string().email().optional(),
        sourceType: z.enum(["supplier", "carrier", "customs", "internal", "other"]).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateEmailSource(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEmailSource(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── API Keys ────────────────────────────────────────
  apiKeysMgmt: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getApiKeys(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        permissions: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const rawKey = `dds_${nanoid(32)}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");
        const keyPrefix = rawKey.substring(0, 12);

        await db.createApiKey({
          userId: ctx.user.id,
          name: input.name,
          keyHash,
          keyPrefix,
          permissions: input.permissions || ["read", "write"],
        });

        return { key: rawKey, prefix: keyPrefix };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteApiKey(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Data Quality ───────────────────────────────────
  dataQuality: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await db.getDashboardStats(ctx.user.id);
      const results = await db.getMatchingResults(ctx.user.id, { limit: 1000 });
      const logs = await db.getProcessingLogs(ctx.user.id, { limit: 500 });

      const totalResults = results.length;
      const highConf = results.filter((r: any) => r.confidenceScore >= 0.8).length;
      const medConf = results.filter((r: any) => r.confidenceScore >= 0.5 && r.confidenceScore < 0.8).length;
      const lowConf = results.filter((r: any) => r.confidenceScore < 0.5).length;
      const unmatched = results.filter((r: any) => !r.matchedCategoryId).length;
      const approved = results.filter((r: any) => r.isApproved).length;

      const failedLogs = logs.filter((l: any) => l.status === "error").length;
      const successLogs = logs.filter((l: any) => l.status === "success").length;
      const totalLogs = logs.length;

      return {
        completionRate: stats.totalDocuments > 0 ? ((stats.completedDocuments / stats.totalDocuments) * 100) : 0,
        parseFailureRate: totalLogs > 0 ? ((failedLogs / totalLogs) * 100) : 0,
        unmatchedRate: totalResults > 0 ? ((unmatched / totalResults) * 100) : 0,
        approvalRate: totalResults > 0 ? ((approved / totalResults) * 100) : 0,
        avgConfidence: stats.avgConfidence,
        confidenceDistribution: { high: highConf, medium: medConf, low: lowConf },
        matchTypeDistribution: {
          semantic: results.filter((r: any) => r.matchType === "semantic").length,
          rule: results.filter((r: any) => r.matchType === "rule").length,
          exact: results.filter((r: any) => r.matchType === "exact").length,
          manual: results.filter((r: any) => r.matchType === "manual").length,
        },
        totalProcessed: successLogs,
        totalFailed: failedLogs,
      };
    }),
  }),

  // ─── Processing Logs ─────────────────────────────────
  logs: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return db.getProcessingLogs(ctx.user.id, input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
