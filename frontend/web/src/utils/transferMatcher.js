import { CLASSIFICATION_TYPES, classifySingleTransaction } from "./classification.js";

/**
 * Calculate difference in calendar days between two YYYY-MM-DD date strings
 */
export function dateDiffDays(dateStrA, dateStrB) {
  const tA = new Date(dateStrA).getTime();
  const tB = new Date(dateStrB).getTime();
  if (isNaN(tA) || isNaN(tB)) return 999;
  return Math.abs(tA - tB) / (1000 * 60 * 60 * 24);
}

/**
 * Automatic cross-account transfer matching engine.
 * Matches outgoing payments with incoming account transfers within ±3 days.
 * Produces linked pairs and assigns classification.
 */
export function matchTransfersAndClassify(transactions = [], accounts = [], options = {}) {
  const { manualMatches = [], manualNotTransfers = [] } = options;
  const notTransferSet = new Set(manualNotTransfers);

  // 1. Initial single-pass classification
  const classifiedMap = new Map();
  for (const tx of transactions) {
    const initialClass = classifySingleTransaction(tx, accounts);
    classifiedMap.set(tx.id, {
      ...tx,
      classification: initialClass,
      transferMatch: null,
    });
  }

  const result = Array.from(classifiedMap.values());
  const pairedIds = new Set();
  const matches = [];

  // 2. Process manual match overrides first
  for (const m of manualMatches) {
    const txA = classifiedMap.get(m.outgoingTransactionId);
    const txB = classifiedMap.get(m.incomingTransactionId);
    if (txA && txB && !pairedIds.has(txA.id) && !pairedIds.has(txB.id)) {
      pairedIds.add(txA.id);
      pairedIds.add(txB.id);

      const transferType = m.transferType || CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT;
      const matchRecord = {
        id: m.id || `manual_match_${txA.id}_${txB.id}`,
        outgoingTransactionId: txA.id,
        incomingTransactionId: txB.id,
        transferType,
        confidence: 1.0,
        matchedAt: new Date().toISOString(),
      };
      matches.push(matchRecord);

      txA.classification = transferType;
      txA.transferMatch = matchRecord;
      txB.classification = transferType;
      txB.transferMatch = matchRecord;
    }
  }

  // 3. Automatic transfer pairing algorithm (Conservative matching)
  const pool = result.filter(
    (t) => !pairedIds.has(t.id) && !notTransferSet.has(t.id) && !t.manualNotTransfer,
  );

  for (let i = 0; i < pool.length; i++) {
    const txA = pool[i];
    if (pairedIds.has(txA.id)) continue;

    let bestMatch = null;
    let bestScore = 0;

    for (let j = 0; j < pool.length; j++) {
      if (i === j) continue;
      const txB = pool[j];
      if (pairedIds.has(txB.id)) continue;

      // Rule 1: Opposite directions (one expense, one income) or opposite raw amounts
      const isOppositeDirection =
        (txA.type === "expense" && txB.type === "income") ||
        (txA.type === "income" && txB.type === "expense");
      if (!isOppositeDirection) continue;

      // Rule 2: Same absolute amount (within 0.01 tolerance)
      const amtA = Math.abs(Number(txA.amount || 0));
      const amtB = Math.abs(Number(txB.amount || 0));
      if (Math.abs(amtA - amtB) > 0.01) continue;

      // Rule 3: Within ±3 calendar days
      const daysDiff = dateDiffDays(txA.date, txB.date);
      if (daysDiff > 3) continue;

      // Rule 4: Different accounts or different card_identities
      const accA = txA.card_identity || txA.source || txA.account_id;
      const accB = txB.card_identity || txB.source || txB.account_id;
      if (accA && accB && accA === accB) continue;

      // Calculate confidence score
      let score = 0.5;
      if (daysDiff === 0) score += 0.2;
      else if (daysDiff <= 1) score += 0.15;
      else score += 0.05;

      const descA = `${txA.description ?? ""} ${txA.merchant_raw ?? ""}`.toLowerCase();
      const descB = `${txB.description ?? ""} ${txB.merchant_raw ?? ""}`.toLowerCase();

      // Account type signals (checking -> credit card)
      const isCardA =
        accA?.toLowerCase().includes("card") ||
        txA.classification === CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT;
      const isCardB =
        accB?.toLowerCase().includes("card") ||
        txB.classification === CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT;
      if ((isCardA && !isCardB) || (isCardB && !isCardA)) {
        score += 0.25;
      }

      if (
        descA.includes("payment") ||
        descB.includes("payment") ||
        descA.includes("transfer") ||
        descB.includes("transfer")
      ) {
        score += 0.1;
      }

      if (score > bestScore && score >= 0.7) {
        bestScore = score;
        bestMatch = txB;
      }
    }

    if (bestMatch) {
      const outgoing = txA.type === "expense" ? txA : bestMatch;
      const incoming = txA.type === "income" ? txA : bestMatch;

      pairedIds.add(outgoing.id);
      pairedIds.add(incoming.id);

      const accOut = outgoing.card_identity || outgoing.source || "";
      const accIn = incoming.card_identity || incoming.source || "";
      const descOut = `${outgoing.description ?? ""} ${outgoing.merchant_raw ?? ""}`.toLowerCase();
      const descIn = `${incoming.description ?? ""} ${incoming.merchant_raw ?? ""}`.toLowerCase();

      const isCardInvolved =
        accOut.toLowerCase().includes("card") ||
        accIn.toLowerCase().includes("card") ||
        accOut.toLowerCase().includes("venture") ||
        accIn.toLowerCase().includes("venture") ||
        descOut.includes("capital one") ||
        descIn.includes("capital one") ||
        outgoing.classification === CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT ||
        incoming.classification === CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT;

      const transferType = isCardInvolved
        ? CLASSIFICATION_TYPES.CREDIT_CARD_PAYMENT
        : CLASSIFICATION_TYPES.INTERNAL_TRANSFER;

      const matchRecord = {
        id: `auto_match_${outgoing.id}_${incoming.id}`,
        outgoingTransactionId: outgoing.id,
        incomingTransactionId: incoming.id,
        transferType,
        confidence: Number(bestScore.toFixed(2)),
        matchedAt: new Date().toISOString(),
      };

      matches.push(matchRecord);

      outgoing.classification = transferType;
      outgoing.transferMatch = matchRecord;
      incoming.classification = transferType;
      incoming.transferMatch = matchRecord;
    }
  }

  return {
    transactions: result,
    matches,
  };
}
