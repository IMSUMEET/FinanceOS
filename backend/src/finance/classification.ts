import {
  FinanceTransaction,
  MerchantRule,
  TransactionId,
  TransactionType,
  backfillTransactions,
  categoryForType,
  clampConfidence,
  isTransactionType,
  toCompatibilityTransaction,
} from "./transactionModel.js";

const CREDIT_CARD_PAYMENT_PATTERNS = [
  /capital\s+one(?:\s+mobile)?\s+(?:pmt|pymt|payment)/i,
  /chase(?:\s+credit)?\s+card\s+payment/i,
  /chase\s+card\s+payment/i,
  /amex\s+payment|american\s+express\s+(?:epayment|ach)/i,
  /citi\s+autopay|citi\s+card\s+payment|citicardap/i,
  /discover\s+(?:e-)?payment/i,
  /sony\s+card\s+payment|playstation\s+card\s+payment/i,
  /payment\s+thank\s+you/i,
  /credit\s+card\s+(?:autopay|payment)|crd\s+autopay/i,
];

const LOAN_PATTERNS = [
  /mortgage|student\s+loan|loan\s+payment|\bemi\b|nelnet|mohela|aidvantage|sallie\s+mae/i,
  /valon\s+payment|auto\s+loan|car\s+loan|personal\s+loan/i,
];

const INCOME_PATTERNS = [
  /payroll|direct\s+deposit|salary|wages|paycheck|employer|social\s+security|pension/i,
];

const REFUND_PATTERNS = [/refund|return|reversal|cashback|cash\s+back|credit\s+memo/i];
const TRANSFER_PATTERNS = [
  /transfer\s+(?:to|from)\s+(?:checking|savings)/i,
  /online\s+transfer\s+(?:to|from)/i,
  /internal\s+transfer|account\s+transfer/i,
];

const AMBIGUOUS_MERCHANTS =
  /^(unknown|other|payment|transfer|paypal|venmo|zelle|cash app|square)$/i;

export interface AccountMetadata extends Record<string, unknown> {
  id?: string;
  plaidAccountId?: string;
  type?: string;
  subtype?: string | null;
  name?: string;
}

export interface ClassificationResult {
  transactions: FinanceTransaction[];
  matches: TransferMatch[];
  unresolved: FinanceTransaction[];
}

export interface TransferMatch {
  outgoingTransactionId: TransactionId;
  incomingTransactionId: TransactionId;
  transferType: "internal_transfer" | "credit_card_payment";
  confidence: number;
}

function transactionText(transaction: FinanceTransaction): string {
  return [
    transaction.description,
    transaction.merchant_raw,
    transaction.merchant_normalized,
    transaction.category,
    transaction.personal_finance_category,
  ]
    .filter(Boolean)
    .join(" ");
}

function accountFor(
  transaction: FinanceTransaction,
  accounts: AccountMetadata[],
): AccountMetadata | undefined {
  const accountId = String(
    transaction.plaid_account_id ?? transaction.account_id ?? transaction.accountId ?? "",
  );
  return accounts.find(
    (account) => account.id === accountId || account.plaidAccountId === accountId,
  );
}

export function accountKind(
  transaction: FinanceTransaction,
  accounts: AccountMetadata[] = [],
): "credit" | "checking" | "savings" | "loan" | "cash" | "unknown" {
  const account = accountFor(transaction, accounts);
  const text = [
    account?.type,
    account?.subtype,
    account?.name,
    transaction.account_type,
    transaction.account_subtype,
    transaction.card_identity,
    transaction.source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/credit|credit card|charge card/.test(text)) return "credit";
  if (/loan|mortgage/.test(text)) return "loan";
  if (/saving|money market/.test(text)) return "savings";
  if (/checking|depository|debit/.test(text)) return "checking";
  if (/cash/.test(text)) return "cash";
  return "unknown";
}

function applyClassification(
  transaction: FinanceTransaction,
  type: TransactionType,
  confidence: number,
  source: "rule" | "manual",
  category?: string,
): FinanceTransaction {
  if (transaction.manual_override && source !== "manual") return transaction;
  const nextCategory = category ?? categoryForType(type, transaction.category);
  return {
    ...transaction,
    transaction_type: type,
    category: nextCategory,
    category_source: source,
    classification_confidence: clampConfidence(confidence),
    is_internal_transfer: type === "internal_transfer",
    type: type === "income" || type === "refund" ? "income" : "expense",
    classification: type.toUpperCase(),
    finalCategory: nextCategory,
    categorySource: source,
  };
}

function findMerchantRule(
  transaction: FinanceTransaction,
  merchantRules: MerchantRule[],
): MerchantRule | undefined {
  const merchant = transaction.merchant_normalized.trim().toLowerCase();
  return merchantRules.find((rule) => rule.merchant_normalized.trim().toLowerCase() === merchant);
}

export function classifyDeterministically(
  transaction: FinanceTransaction,
  accounts: AccountMetadata[] = [],
  merchantRules: MerchantRule[] = [],
): FinanceTransaction {
  if (transaction.manual_override) {
    return applyClassification(
      transaction,
      transaction.transaction_type,
      1,
      "manual",
      transaction.category,
    );
  }

  const merchantRule = findMerchantRule(transaction, merchantRules);
  if (merchantRule) {
    const ruleType = merchantRule.transaction_type ?? transaction.transaction_type;
    const result = applyClassification(
      transaction,
      ruleType,
      0.98,
      "rule",
      merchantRule.category ?? categoryForType(ruleType, transaction.category),
    );
    return { ...result, subcategory: merchantRule.subcategory ?? result.subcategory };
  }

  const text = transactionText(transaction);
  const category = transaction.category.toLowerCase();
  const kind = accountKind(transaction, accounts);
  const incoming = transaction.amount > 0;
  const outgoing = transaction.amount < 0;

  if (!transaction.not_a_transfer) {
    if (
      CREDIT_CARD_PAYMENT_PATTERNS.some((pattern) => pattern.test(text)) ||
      category === "credit card payments" ||
      category === "credit card payment"
    ) {
      return applyClassification(transaction, "credit_card_payment", 0.95, "rule");
    }

    if (TRANSFER_PATTERNS.some((pattern) => pattern.test(text))) {
      return applyClassification(transaction, "internal_transfer", 0.9, "rule");
    }
  }

  if (
    LOAN_PATTERNS.some((pattern) => pattern.test(text)) ||
    category.includes("loan") ||
    category.includes("mortgage")
  ) {
    return applyClassification(transaction, "loan_payment", 0.95, "rule");
  }

  if (incoming && INCOME_PATTERNS.some((pattern) => pattern.test(text))) {
    return applyClassification(transaction, "income", 0.97, "rule", "Income");
  }

  if (incoming && REFUND_PATTERNS.some((pattern) => pattern.test(text))) {
    return applyClassification(transaction, "refund", 0.94, "rule", transaction.category);
  }

  if (incoming && kind === "credit") {
    return applyClassification(transaction, "refund", 0.82, "rule", transaction.category);
  }

  if (incoming && category === "income") {
    return applyClassification(transaction, "income", 0.92, "rule", "Income");
  }
  if (incoming && /^refunds?$/.test(category)) {
    return applyClassification(transaction, "refund", 0.9, "rule", "Other");
  }
  if (!transaction.not_a_transfer && /^transfers?$/.test(category)) {
    return applyClassification(transaction, "internal_transfer", 0.86, "rule");
  }

  if (outgoing) {
    const confidence = !transaction.category || transaction.category === "Other" ? 0.6 : 0.9;
    return applyClassification(transaction, "expense", confidence, "rule", transaction.category);
  }

  return applyClassification(transaction, "other", 0.5, "rule", "Other");
}

function dateDifferenceDays(first: string, second: string): number {
  const firstTime = Date.parse(`${first}T00:00:00Z`);
  const secondTime = Date.parse(`${second}T00:00:00Z`);
  if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) return Number.POSITIVE_INFINITY;
  return Math.abs(firstTime - secondTime) / 86_400_000;
}

function accountIdentity(transaction: FinanceTransaction): string {
  return String(
    transaction.plaid_account_id ??
      transaction.account_id ??
      transaction.card_identity ??
      transaction.source ??
      "",
  ).toLowerCase();
}

function transferPairType(
  outgoing: FinanceTransaction,
  incoming: FinanceTransaction,
  accounts: AccountMetadata[],
): { type: "internal_transfer" | "credit_card_payment"; strength: number } | null {
  const outgoingKind = accountKind(outgoing, accounts);
  const incomingKind = accountKind(incoming, accounts);
  const text = `${transactionText(outgoing)} ${transactionText(incoming)}`;
  const paymentText = CREDIT_CARD_PAYMENT_PATTERNS.some((pattern) => pattern.test(text));
  const transferText = TRANSFER_PATTERNS.some((pattern) => pattern.test(text));
  const cashKinds = new Set(["checking", "savings", "cash"]);
  const creditAndCash =
    (outgoingKind === "credit" && cashKinds.has(incomingKind)) ||
    (incomingKind === "credit" && cashKinds.has(outgoingKind));

  if (
    creditAndCash ||
    paymentText ||
    outgoing.transaction_type === "credit_card_payment" ||
    incoming.transaction_type === "credit_card_payment"
  ) {
    return {
      type: "credit_card_payment",
      strength: creditAndCash ? 0.45 : paymentText ? 0.4 : 0.3,
    };
  }

  const checkingSavings =
    (outgoingKind === "checking" && incomingKind === "savings") ||
    (outgoingKind === "savings" && incomingKind === "checking");
  if (
    checkingSavings ||
    transferText ||
    outgoing.transaction_type === "internal_transfer" ||
    incoming.transaction_type === "internal_transfer"
  ) {
    return {
      type: "internal_transfer",
      strength: checkingSavings ? 0.45 : transferText ? 0.4 : 0.3,
    };
  }

  return null;
}

export function matchTransfers(
  transactions: FinanceTransaction[],
  accounts: AccountMetadata[] = [],
): { transactions: FinanceTransaction[]; matches: TransferMatch[] } {
  const result = transactions.map((transaction) => ({ ...transaction }));
  const paired = new Set<TransactionId>();
  const matches: TransferMatch[] = [];

  for (const outgoing of result) {
    if (
      outgoing.amount >= 0 ||
      paired.has(outgoing.id) ||
      outgoing.manual_override ||
      outgoing.not_a_transfer ||
      outgoing.linked_transaction_id != null
    ) {
      continue;
    }

    let best:
      | {
          incoming: FinanceTransaction;
          type: "internal_transfer" | "credit_card_payment";
          confidence: number;
        }
      | undefined;

    for (const incoming of result) {
      if (
        incoming.amount <= 0 ||
        incoming.id === outgoing.id ||
        paired.has(incoming.id) ||
        incoming.manual_override ||
        incoming.not_a_transfer ||
        incoming.linked_transaction_id != null
      ) {
        continue;
      }
      if (Math.abs(Math.abs(outgoing.amount) - Math.abs(incoming.amount)) > 0.01) continue;
      const days = dateDifferenceDays(outgoing.date, incoming.date);
      if (days > 3) continue;

      const outgoingAccount = accountIdentity(outgoing);
      const incomingAccount = accountIdentity(incoming);
      if (!outgoingAccount || !incomingAccount || outgoingAccount === incomingAccount) continue;

      const evidence = transferPairType(outgoing, incoming, accounts);
      if (!evidence) continue;

      const confidence = Math.min(0.99, 0.35 + evidence.strength + (days === 0 ? 0.15 : 0.1));
      if (confidence < 0.8 || (best && best.confidence >= confidence)) continue;
      best = { incoming, type: evidence.type, confidence };
    }

    if (!best) continue;
    const outgoingIndex = result.findIndex((transaction) => transaction.id === outgoing.id);
    const incomingIndex = result.findIndex((transaction) => transaction.id === best!.incoming.id);
    if (outgoingIndex < 0 || incomingIndex < 0) continue;

    const category = categoryForType(best.type);
    result[outgoingIndex] = {
      ...result[outgoingIndex]!,
      transaction_type: best.type,
      category,
      category_source: "rule",
      classification_confidence: best.confidence,
      linked_transaction_id: best.incoming.id,
      is_internal_transfer: best.type === "internal_transfer",
      classification: best.type.toUpperCase(),
      finalCategory: category,
    };
    result[incomingIndex] = {
      ...result[incomingIndex]!,
      transaction_type: best.type,
      category,
      category_source: "rule",
      classification_confidence: best.confidence,
      linked_transaction_id: outgoing.id,
      is_internal_transfer: best.type === "internal_transfer",
      classification: best.type.toUpperCase(),
      finalCategory: category,
    };
    paired.add(outgoing.id);
    paired.add(best.incoming.id);
    matches.push({
      outgoingTransactionId: outgoing.id,
      incomingTransactionId: best.incoming.id,
      transferType: best.type,
      confidence: Number(best.confidence.toFixed(2)),
    });
  }

  return { transactions: result, matches };
}

export function unresolvedTransactions(transactions: FinanceTransaction[]): FinanceTransaction[] {
  return transactions.filter(
    (transaction) =>
      !transaction.manual_override &&
      (transaction.transaction_type === "other" ||
        transaction.category === "Other" ||
        transaction.classification_confidence == null ||
        transaction.classification_confidence < 0.7),
  );
}

export function classifyTransactions(
  rawTransactions: Record<string, unknown>[],
  options: { accounts?: AccountMetadata[]; merchantRules?: MerchantRule[] } = {},
): ClassificationResult {
  const accounts = options.accounts ?? [];
  const merchantRules = options.merchantRules ?? [];
  const backfilled = backfillTransactions(rawTransactions).map((transaction) =>
    classifyDeterministically(transaction, accounts, merchantRules),
  );
  const matched = matchTransfers(backfilled, accounts);
  const compatible = matched.transactions.map(toCompatibilityTransaction);
  return {
    transactions: compatible,
    matches: matched.matches,
    unresolved: unresolvedTransactions(compatible),
  };
}

export interface AiClassificationProposal {
  id: TransactionId;
  transaction_type: TransactionType;
  category: string;
  subcategory: string | null;
  confidence: number;
  reason: string;
}

export function applyAiClassifications(
  transactions: FinanceTransaction[],
  proposals: AiClassificationProposal[],
): FinanceTransaction[] {
  const proposalMap = new Map(proposals.map((proposal) => [String(proposal.id), proposal]));

  return transactions.map((transaction) => {
    if (transaction.manual_override) return transaction;
    const proposal = proposalMap.get(String(transaction.id));
    if (!proposal || !isTransactionType(proposal.transaction_type)) return transaction;
    const confidence = clampConfidence(proposal.confidence);
    if (confidence == null) return transaction;

    const aiFields = {
      aiTransactionType: proposal.transaction_type,
      aiCategory: proposal.category,
      aiSubcategory: proposal.subcategory,
      aiConfidence: confidence,
      aiReason: proposal.reason,
    };

    if (confidence < 0.7) {
      return toCompatibilityTransaction({
        ...transaction,
        ...aiFields,
        transaction_type: "other",
        category: "Other",
        subcategory: null,
        classification_confidence: confidence,
        category_source: "ai",
      });
    }

    const hasStrongerClassification =
      transaction.category_source === "rule" &&
      (transaction.classification_confidence ?? 0) >= confidence &&
      transaction.transaction_type !== "other" &&
      transaction.category !== "Other";
    if (hasStrongerClassification) return { ...transaction, ...aiFields };

    return toCompatibilityTransaction({
      ...transaction,
      ...aiFields,
      transaction_type: proposal.transaction_type,
      category: proposal.category,
      subcategory: proposal.subcategory,
      classification_confidence: confidence,
      category_source: "ai",
      is_internal_transfer: proposal.transaction_type === "internal_transfer",
    });
  });
}

export function createManualOverride(
  transaction: FinanceTransaction,
  patch: { transaction_type?: TransactionType; category?: string; subcategory?: string | null },
): FinanceTransaction {
  const type = patch.transaction_type ?? transaction.transaction_type;
  const category = patch.category ?? categoryForType(type, transaction.category);
  return toCompatibilityTransaction({
    ...transaction,
    ...patch,
    transaction_type: type,
    category,
    category_source: "manual",
    classification_confidence: 1,
    manual_override: true,
    is_internal_transfer: type === "internal_transfer",
  });
}

export function markNotTransfer(transaction: FinanceTransaction): FinanceTransaction {
  const fallbackType: TransactionType = transaction.amount < 0 ? "expense" : "other";
  return toCompatibilityTransaction({
    ...transaction,
    transaction_type: fallbackType,
    category: fallbackType === "expense" ? transaction.category : "Other",
    category_source: "manual",
    classification_confidence: 1,
    manual_override: true,
    is_internal_transfer: false,
    linked_transaction_id: null,
    not_a_transfer: true,
  });
}

export function merchantRuleFromManualTransaction(
  transaction: FinanceTransaction,
): MerchantRule | null {
  if (!transaction.manual_override || !transaction.merchant_normalized) return null;
  if (AMBIGUOUS_MERCHANTS.test(transaction.merchant_normalized.trim())) return null;
  return {
    merchant_normalized: transaction.merchant_normalized,
    category: transaction.category,
    transaction_type: transaction.transaction_type,
    subcategory: transaction.subcategory,
  };
}
