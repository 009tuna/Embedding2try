import { eq, and, desc, sql, like, asc, count, avg } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  erpCategories, InsertErpCategory,
  documents, InsertDocument,
  matchingResults, InsertMatchingResult,
  matchingRules, InsertMatchingRule,
  emailSources, InsertEmailSource,
  apiKeys, InsertApiKey,
  processingLogs, InsertProcessingLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "companyName"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── ERP Categories ──────────────────────────────────────
export async function createCategory(data: InsertErpCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(erpCategories).values(data);
  return { id: result[0].insertId };
}

export async function getCategories(userId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(erpCategories.userId, userId)];
  if (type) conditions.push(eq(erpCategories.type, type as any));
  return db.select().from(erpCategories).where(and(...conditions)).orderBy(asc(erpCategories.name));
}

export async function getCategoryById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(erpCategories).where(and(eq(erpCategories.id, id), eq(erpCategories.userId, userId))).limit(1);
  return result[0];
}

export async function updateCategory(id: number, userId: number, data: Partial<InsertErpCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(erpCategories).set(data).where(and(eq(erpCategories.id, id), eq(erpCategories.userId, userId)));
}

export async function deleteCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(erpCategories).where(and(eq(erpCategories.id, id), eq(erpCategories.userId, userId)));
}

// ─── Documents ───────────────────────────────────────────
export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(documents).values(data);
  return { id: result[0].insertId };
}

export async function getDocuments(userId: number, opts?: { status?: string; sourceType?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(documents.userId, userId)];
  if (opts?.status) conditions.push(eq(documents.status, opts.status as any));
  if (opts?.sourceType) conditions.push(eq(documents.sourceType, opts.sourceType as any));
  let query = db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.createdAt));
  if (opts?.limit) query = query.limit(opts.limit) as any;
  if (opts?.offset) query = (query as any).offset(opts.offset);
  return query;
}

export async function getDocumentById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, userId))).limit(1);
  return result[0];
}

export async function updateDocument(id: number, userId: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(documents).set(data).where(and(eq(documents.id, id), eq(documents.userId, userId)));
}

export async function deleteDocument(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, userId)));
}

// ─── Matching Results ────────────────────────────────────
export async function createMatchingResults(data: InsertMatchingResult[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (data.length === 0) return;
  await db.insert(matchingResults).values(data);
}

export async function getMatchingResultById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(matchingResults).where(and(eq(matchingResults.id, id), eq(matchingResults.userId, userId))).limit(1);
  return result[0];
}

export async function deleteMatchingResultsByDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(matchingResults).where(and(eq(matchingResults.documentId, documentId), eq(matchingResults.userId, userId)));
}

export async function getMatchingResultsByDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchingResults).where(and(eq(matchingResults.documentId, documentId), eq(matchingResults.userId, userId))).orderBy(desc(matchingResults.confidenceScore));
}

export async function getMatchingResults(userId: number, opts?: { limit?: number; offset?: number; approved?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(matchingResults.userId, userId)];
  if (opts?.approved !== undefined) conditions.push(eq(matchingResults.isApproved, opts.approved));
  let query = db.select().from(matchingResults).where(and(...conditions)).orderBy(desc(matchingResults.createdAt));
  if (opts?.limit) query = query.limit(opts.limit) as any;
  if (opts?.offset) query = (query as any).offset(opts.offset);
  return query;
}

export async function approveMatchingResult(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(matchingResults).set({ isApproved: true, approvedBy: userId, approvedAt: new Date() }).where(and(eq(matchingResults.id, id), eq(matchingResults.userId, userId)));
}

export async function updateMatchingResult(id: number, userId: number, data: Partial<InsertMatchingResult>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(matchingResults).set(data).where(and(eq(matchingResults.id, id), eq(matchingResults.userId, userId)));
}

// ─── Matching Rules ──────────────────────────────────────
export async function createMatchingRule(data: InsertMatchingRule) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(matchingRules).values(data);
  return { id: result[0].insertId };
}

export async function getMatchingRules(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchingRules).where(eq(matchingRules.userId, userId)).orderBy(desc(matchingRules.priority));
}

export async function updateMatchingRule(id: number, userId: number, data: Partial<InsertMatchingRule>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(matchingRules).set(data).where(and(eq(matchingRules.id, id), eq(matchingRules.userId, userId)));
}

export async function deleteMatchingRule(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(matchingRules).where(and(eq(matchingRules.id, id), eq(matchingRules.userId, userId)));
}

// ─── Email Sources ───────────────────────────────────────
export async function createEmailSource(data: InsertEmailSource) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(emailSources).values(data);
  return { id: result[0].insertId };
}

export async function getEmailSources(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailSources).where(eq(emailSources.userId, userId)).orderBy(desc(emailSources.createdAt));
}

export async function updateEmailSource(id: number, userId: number, data: Partial<InsertEmailSource>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailSources).set(data).where(and(eq(emailSources.id, id), eq(emailSources.userId, userId)));
}

export async function deleteEmailSource(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(emailSources).where(and(eq(emailSources.id, id), eq(emailSources.userId, userId)));
}

// ─── API Keys ────────────────────────────────────────────
export async function createApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(apiKeys).values(data);
  return { id: result[0].insertId };
}

export async function getApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, isActive: apiKeys.isActive, lastUsedAt: apiKeys.lastUsedAt, expiresAt: apiKeys.expiresAt, createdAt: apiKeys.createdAt }).from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
}

export async function deleteApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

export async function getApiKeyByHash(keyHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true))).limit(1);
  if (result[0]) {
    // Update lastUsedAt
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, result[0].id));
  }
  return result[0];
}

// ─── Processing Logs ─────────────────────────────────────
export async function createProcessingLog(data: InsertProcessingLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(processingLogs).values(data);
}

export async function getProcessingLogs(userId: number, opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(processingLogs).where(eq(processingLogs.userId, userId)).orderBy(desc(processingLogs.createdAt));
  if (opts?.limit) query = query.limit(opts.limit) as any;
  if (opts?.offset) query = (query as any).offset(opts.offset);
  return query;
}

// ─── Dashboard Stats ─────────────────────────────────────
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalDocuments: 0, pendingDocuments: 0, completedDocuments: 0, totalCategories: 0, totalRules: 0, avgConfidence: 0, totalMatches: 0, approvedMatches: 0 };

  const [docStats] = await db.select({
    total: count(),
    pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
  }).from(documents).where(eq(documents.userId, userId));

  const [catCount] = await db.select({ total: count() }).from(erpCategories).where(eq(erpCategories.userId, userId));
  const [ruleCount] = await db.select({ total: count() }).from(matchingRules).where(eq(matchingRules.userId, userId));

  const [matchStats] = await db.select({
    total: count(),
    approved: sql<number>`SUM(CASE WHEN isApproved = true THEN 1 ELSE 0 END)`,
    avgConf: avg(matchingResults.confidenceScore),
  }).from(matchingResults).where(eq(matchingResults.userId, userId));

  return {
    totalDocuments: docStats?.total ?? 0,
    pendingDocuments: Number(docStats?.pending ?? 0),
    completedDocuments: Number(docStats?.completed ?? 0),
    totalCategories: catCount?.total ?? 0,
    totalRules: ruleCount?.total ?? 0,
    avgConfidence: Number(matchStats?.avgConf ?? 0),
    totalMatches: matchStats?.total ?? 0,
    approvedMatches: Number(matchStats?.approved ?? 0),
  };
}

export async function getRecentActivity(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(processingLogs).where(eq(processingLogs.userId, userId)).orderBy(desc(processingLogs.createdAt)).limit(limit);
}


// ─── Admin ──────────────────────────────────────────────
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalDocuments: 0, totalMatches: 0, totalCategories: 0 };
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [docCount] = await db.select({ count: sql<number>`count(*)` }).from(documents);
  const [matchCount] = await db.select({ count: sql<number>`count(*)` }).from(matchingResults);
  const [catCount] = await db.select({ count: sql<number>`count(*)` }).from(erpCategories);
  return {
    totalUsers: Number(userCount?.count ?? 0),
    totalDocuments: Number(docCount?.count ?? 0),
    totalMatches: Number(matchCount?.count ?? 0),
    totalCategories: Number(catCount?.count ?? 0),
  };
}
