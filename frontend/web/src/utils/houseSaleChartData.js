import { formatCurrency } from "./format";

/**
 * True profit at an arbitrary sale price (same rules as main calculator).
 * @param {number} salePrice
 * @param {{ sellingCostRate: number; remainingBalance: number; totalInvested: number }} p
 */
export function calculateProfitAtSalePrice(
  salePrice,
  { sellingCostRate, remainingBalance, totalInvested },
) {
  const P = Number(salePrice);
  if (!Number.isFinite(P)) return 0;
  const r = Number(sellingCostRate);
  if (!Number.isFinite(r) || r >= 1) return 0;
  const netProceeds = P * (1 - r) - Number(remainingBalance);
  return netProceeds - Number(totalInvested);
}

/**
 * @param {object} opts
 * @param {number} opts.expectedSalePrice
 * @param {number|null|undefined} opts.targetSalePrice
 * @param {number} opts.sellingCostRate
 * @param {number} opts.remainingBalance
 * @param {number} opts.totalInvested
 * @param {number} [opts.pointCount]
 */
export function generateProfitCurveSeries({
  expectedSalePrice,
  targetSalePrice,
  sellingCostRate,
  remainingBalance,
  totalInvested,
  pointCount = 25,
}) {
  const ev = Math.max(Number(expectedSalePrice) || 0, 1);
  const tgtRaw =
    targetSalePrice != null && Number.isFinite(targetSalePrice) ? Number(targetSalePrice) : ev;
  const tgt = Math.max(tgtRaw, ev);

  let start = Math.max(ev * 0.8, 0);
  let end = Math.max(ev * 1.3, tgt * 1.15);

  if (!Number.isFinite(sellingCostRate) || sellingCostRate >= 1) {
    return { points: [], start: 0, end: 0 };
  }

  if (end <= start) {
    end = start + 100_000;
  }

  const n = Math.max(2, Math.floor(pointCount));
  const step = (end - start) / (n - 1);
  const points = [];
  for (let i = 0; i < n; i++) {
    const salePrice = start + step * i;
    points.push({
      salePrice,
      profit: calculateProfitAtSalePrice(salePrice, {
        sellingCostRate,
        remainingBalance,
        totalInvested,
      }),
    });
  }

  return { points, start, end };
}

/**
 * @param {number} principalPaid
 * @param {number} interestPaid
 * @param {number} remainingBalance
 * @returns {{ category: string; total: number }[]}
 */
export function buildLoanCompositionDonutData(principalPaid, interestPaid, remainingBalance) {
  const rows = [
    { category: "Equity built", total: Math.max(0, principalPaid) },
    { category: "Interest cost", total: Math.max(0, interestPaid) },
    { category: "Still owed", total: Math.max(0, remainingBalance) },
  ].filter((d) => d.total > 0);
  return rows.length ? rows : [{ category: "—", total: 1 }];
}

/** @param {Record<string, unknown>} result */
export function getHouseSaleNarrativeBullets(result) {
  if (!result?.isValidModel) return [];

  const lines = [];

  if (result.netProceeds < 0) {
    lines.push(
      "🚨 At this sale price, you may need to bring cash to closing after seller costs and loan payoff.",
    );
  } else if (result.trueProfit < 0) {
    lines.push(
      "⚠️ At this sale price, you may receive cash at closing, but you are not truly profitable after your invested cash and ownership costs.",
    );
  }

  if (result.breakEvenSalePrice != null && result.expectedSalePrice > 0) {
    if (result.expectedSalePrice >= result.breakEvenSalePrice) {
      lines.push(
        "✅ Your expected sale price is above break-even. The sale appears profitable after invested cash.",
      );
    } else {
      const gap = result.breakEvenSalePrice - result.expectedSalePrice;
      lines.push(
        `🧭 You need about ${formatCurrency(gap)} more in sale price to truly break even.`,
      );
    }
  }

  return lines;
}

/**
 * Snap target profit for slider UX.
 * @param {number} n
 */
export function snapTargetProfitSlider(n, { min = 0, max = 250_000, step = 5000 } = {}) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  const s = Math.round(x / step) * step;
  return Math.min(max, Math.max(min, s));
}
