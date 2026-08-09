import { describe, it, expect } from "vitest";
import { CLASSIFICATION_TYPES, classifySingleTransaction } from "./classification.js";
import { matchTransfersAndClassify } from "./transferMatcher.js";

describe("Transaction Classification & Transfer Matching Engine", () => {
  // Test 1: checking -> credit card payment
  it("1. handles checking -> credit card payment pairing", () => {
    const txChecking = {
      id: "tx1",
      date: "2026-08-05",
      amount: 1500,
      type: "expense",
      description: "CAPITAL ONE MOBILE PMT",
      card_identity: "Chase Checking (1133)",
    };
    const txCreditCard = {
      id: "tx2",
      date: "2026-08-06",
      amount: 1500,
      type: "income",
      description: "Payment Received - Thank You",
      card_identity: "Venture X Credit Card (7077)",
    };

    const { transactions, matches } = matchTransfersAndClassify([txChecking, txCreditCard]);
    expect(matches).toHaveLength(1);
    expect(matches[0].transferType).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);

    const c1 = transactions.find((t) => t.id === "tx1");
    const c2 = transactions.find((t) => t.id === "tx2");
    expect(c1.classification).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
    expect(c2.classification).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
  });

  // Test 2: payment received on credit card
  it("2. classifies standalone payment received on credit card", () => {
    const tx = {
      id: "tx_cc_pmt",
      date: "2026-08-05",
      amount: 400,
      type: "income",
      description: "CAPITAL ONE MOBILE PMT",
      card_identity: "Venture X Credit Card (7077)",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
  });

  // Test 3: checking -> savings transfer
  it("3. pairs checking -> savings internal transfer", () => {
    const tx1 = {
      id: "ch1",
      date: "2026-08-01",
      amount: 500,
      type: "expense",
      description: "Online Transfer to Savings",
      card_identity: "Chase Checking (1133)",
    };
    const tx2 = {
      id: "sa1",
      date: "2026-08-01",
      amount: 500,
      type: "income",
      description: "Online Transfer from Checking",
      card_identity: "Chase Savings (5544)",
    };

    const { transactions, matches } = matchTransfersAndClassify([tx1, tx2]);
    expect(matches).toHaveLength(1);
    expect(matches[0].transferType).toBe(CLASSIFICATION_TYPES.INTERNAL_TRANSFER);
    expect(transactions[0].classification).toBe(CLASSIFICATION_TYPES.INTERNAL_TRANSFER);
  });

  // Test 4: savings -> checking transfer
  it("4. pairs savings -> checking internal transfer", () => {
    const tx1 = {
      id: "sa2",
      date: "2026-08-02",
      amount: 300,
      type: "expense",
      description: "Transfer to Checking",
      card_identity: "Chase Savings (5544)",
    };
    const tx2 = {
      id: "ch2",
      date: "2026-08-03",
      amount: 300,
      type: "income",
      description: "Transfer from Savings",
      card_identity: "Chase Checking (1133)",
    };

    const { matches } = matchTransfersAndClassify([tx1, tx2]);
    expect(matches).toHaveLength(1);
    expect(matches[0].transferType).toBe(CLASSIFICATION_TYPES.INTERNAL_TRANSFER);
  });

  // Test 5: actual credit-card purchase
  it("5. classifies actual credit-card purchase as EXPENSE", () => {
    const tx = {
      id: "purch1",
      date: "2026-08-04",
      amount: 80,
      type: "expense",
      description: "Chipotle Mexican Grill",
      card_identity: "Venture X Credit Card (7077)",
      category: "Restaurants",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.EXPENSE);
  });

  // Test 6: credit-card refund
  it("6. classifies merchant credit/refund on credit card as REFUND", () => {
    const tx = {
      id: "ref1",
      date: "2026-08-06",
      amount: 45.5,
      type: "income",
      description: "AMAZON.COM REFUND",
      card_identity: "Venture X Credit Card (7077)",
    };
    const res = classifySingleTransaction(tx, [{ plaidAccountId: "acc1", type: "credit" }]);
    expect(res).toBe(CLASSIFICATION_TYPES.REFUND);
  });

  // Test 7: salary deposit
  it("7. classifies salary / payroll deposit as INCOME", () => {
    const tx = {
      id: "sal1",
      date: "2026-07-31",
      amount: 3438.11,
      type: "income",
      description: "MICROSOFT EDIPAYMENT PPD ID: 9911144442",
      card_identity: "Chase Checking (1133)",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.INCOME);
  });

  // Test 8: same-dollar unrelated transactions occurring on nearby dates (conservative non-match)
  it("8. avoids false positive matching on same-dollar unrelated purchases", () => {
    const tx1 = {
      id: "store_purchase",
      date: "2026-08-01",
      amount: 50,
      type: "expense",
      description: "Target Store",
      card_identity: "Chase Checking (1133)",
    };
    const tx2 = {
      id: "friend_repayment",
      date: "2026-08-03",
      amount: 50,
      type: "income",
      description: "Zelle payment from Friend",
      card_identity: "Chase Checking (1133)",
    };

    const { matches } = matchTransfersAndClassify([tx1, tx2]);
    expect(matches).toHaveLength(0); // Same account so should NOT match as transfer
  });

  // Test 9: payment where only checking-side transaction exists
  it("9. classifies single-sided payment on checking account as CREDIT_CARD_PAYMENT", () => {
    const tx = {
      id: "chk_pmt_only",
      date: "2026-08-02",
      amount: 600,
      type: "expense",
      description: "CITI AUTOPAY PAYMENT CITICARDAP",
      card_identity: "Chase Checking (1133)",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
  });

  // Test 10: payment where only credit-card-side transaction exists
  it("10. classifies single-sided payment on credit-card account as CREDIT_CARD_PAYMENT", () => {
    const tx = {
      id: "cc_pmt_only",
      date: "2026-08-02",
      amount: 600,
      type: "income",
      description: "AUTOMATIC PAYMENT - THANK YOU",
      card_identity: "Citi Credit Card (5246)",
      category: "Credit Card Payments",
    };
    const res = classifySingleTransaction(tx);
    expect(res).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
  });

  // Test 11: duplicate Plaid sync handling
  it("11. handles duplicate Plaid sync without creating duplicate matches", () => {
    const tx1 = {
      id: "tx_dup1",
      externalTransactionId: "ext123",
      date: "2026-08-01",
      amount: 100,
      type: "expense",
      description: "AMEX PAYMENT",
      card_identity: "Chase Checking (1133)",
    };
    const tx2 = {
      id: "tx_dup2",
      externalTransactionId: "ext456",
      date: "2026-08-01",
      amount: 100,
      type: "income",
      description: "PAYMENT RECEIVED",
      card_identity: "Amex Credit Card (3006)",
    };

    const { matches: matches1 } = matchTransfersAndClassify([tx1, tx2]);
    const { matches: matches2 } = matchTransfersAndClassify([tx1, tx2, { ...tx1 }]);

    expect(matches1).toHaveLength(1);
    expect(matches2).toHaveLength(1);
  });

  // Test 12: manual transfer override
  it("12. respects manual transfer override", () => {
    const tx1 = {
      id: "m_tx1",
      date: "2026-08-01",
      amount: 75,
      type: "expense",
      description: "Custom Payment",
      manualClassification: CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT,
    };
    const res = classifySingleTransaction(tx1);
    expect(res).toBe(CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT);
  });

  // Test 13: manual 'not a transfer' override
  it("13. respects manual 'not a transfer' override", () => {
    const tx1 = {
      id: "nt_tx1",
      date: "2026-08-01",
      amount: 100,
      type: "expense",
      description: "CAPITAL ONE PMT",
      manualNotTransfer: true,
    };
    const tx2 = {
      id: "nt_tx2",
      date: "2026-08-01",
      amount: 100,
      type: "income",
      description: "Payment Received",
    };

    const { matches } = matchTransfersAndClassify([tx1, tx2], [], {
      manualNotTransfers: ["nt_tx1"],
    });
    expect(matches).toHaveLength(0);
  });
});
