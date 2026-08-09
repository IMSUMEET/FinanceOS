import { describe, it, expect } from "vitest";
import {
  classifySingleTransaction,
  CLASSIFICATION_TYPES,
} from "../frontend/web/src/utils/classification.js";
import { matchTransfersAndClassify } from "../frontend/web/src/utils/transferMatcher.js";
import { totalIncome, totalSpend } from "../frontend/web/src/utils/insights.js";

describe("FinanceOS Accounting & Classification Pipeline (Phase 23 Tests)", () => {
  it("1. Normal credit-card expense", () => {
    const tx = {
      amount: -85.42,
      description: "Whole Foods",
      card_identity: "Chase Credit Card",
      type: "expense",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.EXPENSE);
  });

  it("2. Debit/checking expense", () => {
    const tx = {
      amount: -12.5,
      description: "Local Bakery",
      card_identity: "Chase Checking",
      type: "expense",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.EXPENSE);
  });

  it("3. Salary income", () => {
    const tx = {
      amount: 3500,
      description: "ACME CORP DIRECT DEPOSIT PAYROLL",
      card_identity: "Chase Checking",
      type: "income",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.INCOME);
  });

  it("4. Merchant refund", () => {
    const tx = {
      amount: 25.0,
      description: "WHOLE FOODS REFUND",
      card_identity: "Chase Credit Card",
      type: "income",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.REFUND);
  });

  it("5. Checking -> credit card payment pattern", () => {
    const tx = {
      amount: -1612.79,
      description: "CAPITAL ONE MOBILE PYMT",
      card_identity: "Chase Checking",
      type: "expense",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
  });

  it("6. Credit card side payment received", () => {
    const tx = {
      amount: 1612.79,
      description: "PAYMENT THANK YOU",
      card_identity: "Venture X",
      category: "Credit Card Payments",
      type: "income",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
  });

  it("7. Matched credit card payment pair", () => {
    const txs = [
      {
        id: 1,
        date: "2026-08-01",
        amount: -1612.79,
        description: "CAPITAL ONE MOBILE PAYMENT",
        card_identity: "Chase Checking",
        type: "expense",
      },
      {
        id: 2,
        date: "2026-08-02",
        amount: 1612.79,
        description: "PAYMENT THANK YOU",
        card_identity: "Venture X",
        type: "income",
      },
    ];
    const { transactions, matches } = matchTransfersAndClassify(txs);
    expect(matches.length).toBe(1);
    expect(transactions[0].classification).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
    expect(transactions[1].classification).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
  });

  it("8 & 9 & 10. Checking -> savings internal transfer pair", () => {
    const txs = [
      {
        id: 1,
        date: "2026-08-05",
        amount: -500.0,
        description: "ONLINE TRANSFER TO SAVINGS",
        card_identity: "Chase Checking",
        type: "expense",
      },
      {
        id: 2,
        date: "2026-08-05",
        amount: 500.0,
        description: "ONLINE TRANSFER FROM CHECKING",
        card_identity: "Chase Savings",
        type: "income",
      },
    ];
    const { transactions, matches } = matchTransfersAndClassify(txs);
    expect(matches.length).toBe(1);
    expect(transactions[0].classification).toBe(CLASSIFICATION_TYPES.INTERNAL_TRANSFER);
    expect(transactions[1].classification).toBe(CLASSIFICATION_TYPES.INTERNAL_TRANSFER);
  });

  it("11. Same amount unrelated transactions near same date on SAME account should not pair", () => {
    const txs = [
      {
        id: 1,
        date: "2026-08-05",
        amount: -50.0,
        description: "Gas Station A",
        card_identity: "Chase Checking",
        type: "expense",
      },
      {
        id: 2,
        date: "2026-08-05",
        amount: 50.0,
        description: "Gas Station B Refund",
        card_identity: "Chase Checking",
        type: "income",
      },
    ];
    const { matches } = matchTransfersAndClassify(txs);
    expect(matches.length).toBe(0);
  });

  it("12. Loan payment pattern", () => {
    const tx = {
      amount: -1200.0,
      description: "VALON MORTGAGE PAYMENT",
      card_identity: "Chase Checking",
      type: "expense",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.LOAN_PAYMENT);
  });

  it("16 & 25. Manual category override cannot be overwritten", () => {
    const tx = {
      amount: -50.0,
      description: "Unknown Merchant",
      manual_override: true,
      transaction_type: "expense",
      category: "Groceries",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.EXPENSE);
  });

  it("22. Refund reduces spending and does not count as income", () => {
    const txs = [
      {
        id: 1,
        amount: -100.0,
        transaction_type: "expense",
        category: "Groceries",
        type: "expense",
      },
      {
        id: 2,
        amount: 30.0,
        transaction_type: "refund",
        classification: CLASSIFICATION_TYPES.REFUND,
        category: "Groceries",
        type: "income",
      },
    ];
    expect(totalSpend(txs)).toBe(70.0);
    expect(totalIncome(txs)).toBe(0.0);
  });

  it("23 & 24. Credit card payments and internal transfers excluded from spending and income", () => {
    const txs = [
      { id: 1, amount: -100.0, transaction_type: "expense", type: "expense" },
      {
        id: 2,
        amount: -500.0,
        transaction_type: "credit_card_payment",
        category: "Debt Payment",
        type: "expense",
      },
      {
        id: 3,
        amount: -200.0,
        transaction_type: "internal_transfer",
        category: "Transfer",
        type: "expense",
      },
      { id: 4, amount: 2000.0, transaction_type: "income", type: "income" },
    ];
    expect(totalSpend(txs)).toBe(100.0);
    expect(totalIncome(txs)).toBe(2000.0);
  });
});
