export const CLASSIFICATION_TYPES = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
  CREDIT_CARD_PAYMENT: "CREDIT_CARD_PAYMENT",
  LOAN_PAYMENT: "LOAN_PAYMENT",
  REFUND: "REFUND",
  UNKNOWN: "UNKNOWN",
};

// Patterns for credit card payments
const CC_PAYMENT_PATTERNS = [
  /chase\s+credit\s+card/i,
  /capital\s+one\s+pmt|capital\s+one\s+payment|capital\s+one\s+mobile\s+pmt/i,
  /amex\s+payment|american\s+express\s+epayment|american\s+express\s+ach/i,
  /citi\s+autopay|citi\s+card\s+payment|citicardap/i,
  /discover\s+payment|discover\s+e-payment/i,
  /sony\s+card|playstation\s+card\s+payment/i,
  /credit\s+card\s+autopay|credit\s+card\s+payment|crd\s+autopay/i,
];

// Patterns for loan / EMI payments
const LOAN_PATTERNS = [
  /valon\s+payment|mortgage|student\s+loan|loan\s+payment|emi\s+payment|nelnet|mohela|aidvantage|sallie\s+mae/i,
];

// Patterns for salary / payroll
const SALARY_PATTERNS = [/payroll|edipayment|direct\s+deposit|salary|wages|employer/i];

/**
 * Classify a single transaction based on metadata, description, category, and account type
 */
export function classifySingleTransaction(tx, accounts = []) {
  if (tx.manualClassification) {
    return tx.manualClassification;
  }

  const rawAmount = Number(tx.rawAmount ?? (tx.type === "income" ? -tx.amount : tx.amount) ?? 0);
  const isIncome = rawAmount < 0 || tx.type === "income";
  const desc =
    `${tx.description ?? ""} ${tx.merchant ?? ""} ${tx.merchant_raw ?? ""} ${tx.merchant_normalized ?? ""}`.trim();
  const cat = (tx.category ?? tx.finalCategory ?? "").toLowerCase();

  // Find associated account if available
  const acc = accounts.find(
    (a) =>
      a.id === tx.account_id ||
      a.plaidAccountId === tx.account_id ||
      (tx.card_identity && a.mask && tx.card_identity.includes(a.mask)),
  );
  const isCreditAccount =
    acc?.type === "credit" ||
    tx.card_identity?.toLowerCase().includes("card") ||
    cat.includes("credit card");

  // 1. Credit Card Payment pattern description
  if (
    CC_PAYMENT_PATTERNS.some((p) => p.test(desc)) ||
    cat === "credit card payments" ||
    cat === "credit card"
  ) {
    return CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT;
  }

  // 2. Loan payment pattern
  if (LOAN_PATTERNS.some((p) => p.test(desc)) || cat.includes("loan") || cat.includes("mortgage")) {
    return CLASSIFICATION_TYPES.LOAN_PAYMENT;
  }

  // 3. Merchant refund on credit card
  if (isIncome && isCreditAccount) {
    return CLASSIFICATION_TYPES.REFUND;
  }

  // 4. Salary / Payroll Income
  if (
    isIncome &&
    (SALARY_PATTERNS.some((p) => p.test(desc)) ||
      cat.includes("payroll") ||
      cat.includes("deposit"))
  ) {
    return CLASSIFICATION_TYPES.INCOME;
  }

  // 5. Default fallback based on income vs expense
  if (isIncome) {
    return CLASSIFICATION_TYPES.INCOME;
  }

  return CLASSIFICATION_TYPES.EXPENSE;
}
