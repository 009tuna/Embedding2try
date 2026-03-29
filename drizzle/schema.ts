import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, json, bigint, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  companyName: varchar("companyName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * ERP Categories - Standard categories for mapping dark data
 * Types: expense (gider kalemi), operation (operasyon tipi), material (hammadde), route (rota), supplier (tedarikçi)
 */
export const erpCategories = mysqlTable("erp_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["expense", "operation", "material", "route", "supplier", "custom"]).notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parentId"),
  erpField: varchar("erpField", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ErpCategory = typeof erpCategories.$inferSelect;
export type InsertErpCategory = typeof erpCategories.$inferInsert;

/**
 * Documents - Uploaded documents (emails, invoices, waybills, order notes)
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["email", "waybill", "invoice", "order_note", "customs", "price_quote", "other"]).notNull(),
  rawContent: text("rawContent").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  fileName: varchar("fileName", { length: 255 }),
  mimeType: varchar("mimeType", { length: 128 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  supplierName: varchar("supplierName", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Matching Results - Results of AI-powered semantic matching
 */
export const matchingResults = mysqlTable("matching_results", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  extractedTerm: varchar("extractedTerm", { length: 500 }).notNull(),
  matchedCategoryId: int("matchedCategoryId"),
  matchedCategoryName: varchar("matchedCategoryName", { length: 255 }),
  confidenceScore: float("confidenceScore").notNull(),
  matchType: mysqlEnum("matchType", ["semantic", "rule", "exact", "manual"]).default("semantic").notNull(),
  erpField: varchar("erpField", { length: 128 }),
  standardizedValue: text("standardizedValue"),
  isApproved: boolean("isApproved").default(false).notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  llmExplanation: text("llmExplanation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchingResult = typeof matchingResults.$inferSelect;
export type InsertMatchingResult = typeof matchingResults.$inferInsert;

/**
 * Matching Rules - User-defined rules for automatic matching
 */
export const matchingRules = mysqlTable("matching_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sourcePattern: varchar("sourcePattern", { length: 500 }).notNull(),
  targetCategoryId: int("targetCategoryId").notNull(),
  matchStrategy: mysqlEnum("matchStrategy", ["exact", "contains", "regex", "semantic"]).default("contains").notNull(),
  priority: int("priority").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  timesApplied: int("timesApplied").default(0).notNull(),
  lastAppliedAt: timestamp("lastAppliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchingRule = typeof matchingRules.$inferSelect;
export type InsertMatchingRule = typeof matchingRules.$inferInsert;

/**
 * Email Sources - Configured email sources for automatic monitoring
 */
export const emailSources = mysqlTable("email_sources", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["supplier", "carrier", "customs", "internal", "other"]).default("supplier").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  totalProcessed: int("totalProcessed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSource = typeof emailSources.$inferSelect;
export type InsertEmailSource = typeof emailSources.$inferInsert;

/**
 * API Keys - For external ERP system integrations
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 128 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(),
  permissions: json("permissions"),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Processing Logs - Audit trail for all processing activities
 */
export const processingLogs = mysqlTable("processing_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentId: int("documentId"),
  action: varchar("action", { length: 64 }).notNull(),
  details: json("details"),
  status: mysqlEnum("status", ["success", "warning", "error"]).default("success").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProcessingLog = typeof processingLogs.$inferSelect;
export type InsertProcessingLog = typeof processingLogs.$inferInsert;
