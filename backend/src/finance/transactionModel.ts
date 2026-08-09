export const TRANSACTION_TYPES = [
  "expense",
  "income",
  "refund",
  "internal_transfer",
  "credit_card_payment",
  "loan_payment",
  "other",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CATEGORY_SOURCES = ["manual", "rule", "ai", "plaid", "csv", "unknown"] as const;
export type CategorySource = (typeof CATEGORY_SOURCES)[number];

export const CANONICAL_CATEGORIES = [
  // Expense
  "Housing",
  "Food",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Travel",
  "Health & Personal",
  "Family & Giving",
  "Other",
  // Income
  "Salary",
  "Investment Income",
  "Business Income",
  "Reimbursements",
  "Other Income",
  // Transfer
  "Internal Transfer",
  // Debt Payment
  "Credit Card Payment",
  "Loan Payment",
  // Refund
  "Refund",
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];
export type TransactionId = string | number;

export interface MerchantRule {
  merchant_normalized: string;
  category?: string;
  transaction_type?: TransactionType;
  subcategory?: string | null;
}

export interface FinanceTransaction extends Record<string, unknown> {
  id: TransactionId;
  date: string;
  merchant_raw: string;
  merchant_normalized: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  source: string;
  card_identity?: string;
  created_at: string;
  transaction_type: TransactionType;
  subcategory: string | null;
  category_source: CategorySource;
  classification_confidence: number | null;
  manual_override: boolean;
  is_internal_transfer: boolean;
  linked_transaction_id: TransactionId | null;
  aiTransactionType: TransactionType | null;
  aiCategory: string | null;
  aiSubcategory: string | null;
  aiConfidence: number | null;
  aiReason: string | null;
  not_a_transfer?: boolean;
}

const LEGACY_TYPE_MAP: Record<string, TransactionType> = {
  EXPENSE: "expense",
  INCOME: "income",
  REFUND: "refund",
  INTERNAL_TRANSFER: "internal_transfer",
  CREDIT_CARD_PAYMENT: "credit_card_payment",
  LOAN_PAYMENT: "loan_payment",
  UNKNOWN: "other",
};

export function isTransactionType(value: unknown): value is TransactionType {
  return typeof value === "string" && TRANSACTION_TYPES.includes(value as TransactionType);
}

export function clampConfidence(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return Math.min(1, Math.max(0, numberValue));
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function boolValue(value: unknown): boolean {
  return value === true || value === "true";
}

function categorySource(value: unknown, source: string): CategorySource {
  if (typeof value === "string" && CATEGORY_SOURCES.includes(value as CategorySource)) {
    return value as CategorySource;
  }
  if (value === "local" || value === "fallback") return "rule";
  if (source === "plaid" || source.toLowerCase().includes("plaid")) return "plaid";
  if (source.toLowerCase().includes("csv") || source.toLowerCase().includes("analyze")) {
    return "csv";
  }
  return "unknown";
}

function transactionType(value: unknown): TransactionType | null {
  if (isTransactionType(value)) return value;
  if (typeof value === "string") return LEGACY_TYPE_MAP[value.toUpperCase()] ?? null;
  return null;
}

function signedAmount(input: Record<string, unknown>): number {
  const amount = Number(input.amount ?? 0);
  const finiteAmount = Number.isFinite(amount) ? amount : 0;
  const rawPlaid = input.rawPlaid;

  if (rawPlaid && typeof rawPlaid === "object" && "amount" in rawPlaid) {
    const plaidAmount = Number((rawPlaid as Record<string, unknown>).amount ?? 0);
    if (Number.isFinite(plaidAmount)) return -plaidAmount;
  }

  const legacyType = String(input.type ?? "").toLowerCase();
  if (legacyType === "expense" && finiteAmount > 0) return -finiteAmount;
  if (legacyType === "income" && finiteAmount < 0) return Math.abs(finiteAmount);
  return finiteAmount;
}

function fallbackCreatedAt(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
}

/**
 * Safely upgrades a legacy CSV/Plaid/UI transaction without dropping fields.
 * FinanceOS uses signed amounts: negative is outgoing and positive is incoming.
 */
export function backfillTransaction(
  input: Record<string, unknown>,
  fallbackId: TransactionId,
): FinanceTransaction {
  const date = stringValue(input.date, new Date().toISOString().slice(0, 10));
  const description = stringValue(
    input.description,
    stringValue(input.merchant_raw, stringValue(input.merchant, "Unknown")),
  );
  const merchantRaw = stringValue(input.merchant_raw, description);
  const merchantNormalized = stringValue(
    input.merchant_normalized,
    stringValue(input.merchant, merchantRaw),
  );
  const source = stringValue(input.source, "unknown");
  const manualOverride = boolValue(input.manual_override ?? input.manualOverride);
  const manualType = transactionType(input.manualClassification);
  const existingType =
    transactionType(input.transaction_type ?? input.transactionType) ?? manualType;
  const amount = signedAmount(input);

  const inferredType: TransactionType =
    existingType ?? (amount < 0 ? "expense" : amount > 0 ? "other" : "other");
  const classification = clampConfidence(
    input.classification_confidence ?? input.classificationConfidence,
  );
  const sourceValue = manualOverride
    ? "manual"
    : categorySource(input.category_source ?? input.categorySource, source);

  const result: FinanceTransaction = {
    ...input,
    id: (input.id as TransactionId | undefined) ?? fallbackId,
    date,
    merchant_raw: merchantRaw,
    merchant_normalized: merchantNormalized,
    description,
    amount,
    currency: stringValue(input.currency, "USD"),
    category: stringValue(
      input.category,
      stringValue(input.finalCategory, stringValue(input.localCategory, "Other")),
    ),
    source,
    created_at: stringValue(input.created_at, fallbackCreatedAt(date)),
    transaction_type: inferredType,
    subcategory: nullableString(input.subcategory),
    category_source: sourceValue,
    classification_confidence: manualOverride ? 1 : classification,
    manual_override: manualOverride,
    is_internal_transfer: boolValue(input.is_internal_transfer),
    linked_transaction_id:
      (input.linked_transaction_id as TransactionId | null | undefined) ?? null,
    aiTransactionType: transactionType(input.aiTransactionType),
    aiCategory: nullableString(input.aiCategory),
    aiSubcategory: nullableString(input.aiSubcategory),
    aiConfidence: clampConfidence(input.aiConfidence),
    aiReason: nullableString(input.aiReason ?? input.reason),
    not_a_transfer: boolValue(input.not_a_transfer ?? input.manualNotTransfer),
  };

  if (input.card_identity != null) result.card_identity = String(input.card_identity);
  return result;
}

export function backfillTransactions(
  transactions: Record<string, unknown>[],
): FinanceTransaction[] {
  return transactions.map((transaction, index) => backfillTransaction(transaction, index + 1));
}

export function categoryForType(type: TransactionType, existing = "Other"): string {
  if (type === "income") return "Income";
  if (type === "internal_transfer") return "Transfer";
  if (type === "credit_card_payment" || type === "loan_payment") return "Debt Payment";
  if (type === "other") return "Other";
  return existing || "Other";
}

export function legacyTypeFor(type: TransactionType): "income" | "expense" {
  return type === "income" || type === "refund" ? "income" : "expense";
}

export function toCompatibilityTransaction(transaction: FinanceTransaction): FinanceTransaction {
  return {
    ...transaction,
    type: legacyTypeFor(transaction.transaction_type),
    classification: transaction.transaction_type.toUpperCase(),
    finalCategory: transaction.category,
    categorySource: transaction.category_source,
    localCategory: transaction.category,
    localConfidence: transaction.classification_confidence ?? 0,
  };
}
