import { computeMortgageSummary } from "./mortgageCalculations.js";

function clampNonNegative(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return 0;
  return x;
}

function clampPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return 0;
  return x;
}

/** @param {string|undefined|null} str */
function parsePurchaseDate(str) {
  if (str == null || String(str).trim() === "") return null;
  const s = String(str).trim();
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function readOptionalNumber(form, key) {
  const v = form?.[key];
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>} raw  normalized numeric fields + purchaseDate string
 * @param {Date} [asOf]
 * @param {Record<string, unknown>} [form]  original form state for validating negatives on optional %
 */
export function computeHouseSale(raw, asOf = new Date(), form = {}) {
  const validationErrors = [];

  const purchasePrice = Number(raw.purchasePrice);
  const downPayment = Number(raw.downPayment);
  const purchaseDate = parsePurchaseDate(raw.purchaseDate);
  const annualInterestRate = Number(raw.annualInterestRate);
  const loanTermYears = Number(raw.loanTermYears);
  const expectedSalePrice = Number(raw.expectedSalePrice);
  const agentCommissionPct = clampPct(raw.agentCommissionPct);
  const closingCostsPct = clampPct(raw.closingCostsPct);
  const repairsImprovements = clampNonNegative(raw.repairsImprovements);
  const annualPropertyTax = clampNonNegative(raw.annualPropertyTax);
  const annualInsurance = clampNonNegative(raw.annualInsurance);
  const monthlyHoa = clampNonNegative(raw.monthlyHoa);
  const maintenanceTotal = clampNonNegative(raw.maintenanceTotal);
  const targetProfit = Number(raw.targetProfit);
  const targetProfitSafe = Number.isFinite(targetProfit) ? targetProfit : 0;

  const rawAgent = readOptionalNumber(form, "agentCommissionPct");
  const rawClosing = readOptionalNumber(form, "closingCostsPct");
  if (rawAgent != null && rawAgent < 0) {
    validationErrors.push("Agent commission % cannot be negative.");
  }
  if (rawClosing != null && rawClosing < 0) {
    validationErrors.push("Seller closing costs % cannot be negative.");
  }

  if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    validationErrors.push("Purchase price must be greater than 0.");
  }
  if (!Number.isFinite(downPayment) || downPayment < 0) {
    validationErrors.push("Down payment cannot be negative.");
  }
  if (
    Number.isFinite(purchasePrice) &&
    Number.isFinite(downPayment) &&
    downPayment > purchasePrice
  ) {
    validationErrors.push("Down payment cannot exceed purchase price.");
  }
  if (!Number.isFinite(annualInterestRate) || annualInterestRate < 0) {
    validationErrors.push("Interest rate cannot be negative.");
  }
  if (!Number.isFinite(loanTermYears) || loanTermYears <= 0) {
    validationErrors.push("Loan term must be greater than 0.");
  }
  if (raw.purchaseDate == null || String(raw.purchaseDate).trim() === "") {
    validationErrors.push("Enter a purchase date.");
  } else if (!purchaseDate) {
    validationErrors.push("Purchase date is not valid.");
  } else if (startOfLocalDay(purchaseDate) > startOfLocalDay(asOf)) {
    validationErrors.push("Purchase date cannot be in the future.");
  }
  if (!Number.isFinite(expectedSalePrice) || expectedSalePrice < 0) {
    validationErrors.push("Expected sale price cannot be negative.");
  }

  const agentRate = agentCommissionPct / 100;
  const sellerClosingRate = closingCostsPct / 100;
  const sellingCostRate = agentRate + sellerClosingRate;

  const sellingCostBlocked = sellingCostRate >= 1;

  const errors = [
    ...validationErrors,
    ...(sellingCostBlocked
      ? ["Agent commission plus seller closing costs must stay below 100%."]
      : []),
  ];

  const projectionsOk = validationErrors.length === 0 && !sellingCostBlocked;

  /** @type {import("../types/houseSale.js").MortgageSummaryComputed} */
  let mortgage = {
    originalLoanAmount: 0,
    monthlyPayment: 0,
    monthsElapsed: 0,
    yearsOwned: 0,
    remainingBalance: 0,
    principalPaidDown: 0,
  };

  const canComputeMortgage =
    purchaseDate &&
    Number.isFinite(purchasePrice) &&
    purchasePrice > 0 &&
    Number.isFinite(downPayment) &&
    downPayment >= 0 &&
    downPayment <= purchasePrice &&
    Number.isFinite(annualInterestRate) &&
    annualInterestRate >= 0 &&
    Number.isFinite(loanTermYears) &&
    loanTermYears > 0 &&
    startOfLocalDay(purchaseDate) <= startOfLocalDay(asOf);
  const canComputePriceTargets = canComputeMortgage && !sellingCostBlocked;

  if (canComputeMortgage) {
    mortgage = computeMortgageSummary({
      purchasePrice,
      downPayment,
      purchaseDate,
      annualInterestRateApr: annualInterestRate,
      loanTermYears,
      asOf,
    });
  }

  const remainingBalance = mortgage.remainingBalance;
  const yearsOwned = mortgage.yearsOwned;

  const agentCommission = expectedSalePrice * agentRate;
  const sellerClosingCosts = expectedSalePrice * sellerClosingRate;
  const totalSellingCosts = agentCommission + sellerClosingCosts;

  const netProceeds = expectedSalePrice - totalSellingCosts - remainingBalance;

  const propertyTaxPaid = annualPropertyTax * yearsOwned;
  const insurancePaid = annualInsurance * yearsOwned;
  const hoaPaid = monthlyHoa * 12 * yearsOwned;

  const totalInvested =
    downPayment +
    repairsImprovements +
    maintenanceTotal +
    propertyTaxPaid +
    insurancePaid +
    hoaPaid;

  const trueProfit = netProceeds - totalInvested;

  const denom = 1 - sellingCostRate;
  let breakEvenSalePrice = null;
  let minSalePriceNetProceedsZero = null;
  let targetSalePrice = null;

  if (canComputePriceTargets) {
    breakEvenSalePrice = (remainingBalance + totalInvested) / denom;
    minSalePriceNetProceedsZero = remainingBalance / denom;
    targetSalePrice = (remainingBalance + totalInvested + targetProfitSafe) / denom;
  }

  let roiPercent = null;
  let cashReturnedMultiple = null;
  if (totalInvested > 0) {
    roiPercent = (trueProfit / totalInvested) * 100;
    cashReturnedMultiple = netProceeds / totalInvested;
  }

  const gapBreakEvenVsExpected =
    breakEvenSalePrice != null && Number.isFinite(expectedSalePrice)
      ? expectedSalePrice - breakEvenSalePrice
      : null;

  return {
    errors,
    validationErrors,
    sellingCostBlocked,
    mortgage,
    agentCommission,
    sellerClosingCosts,
    totalSellingCosts,
    netProceeds,
    totalInvested,
    trueProfit,
    breakEvenSalePrice,
    targetSalePrice,
    roiPercent,
    cashReturnedMultiple,
    sellingCostRate,
    isValidModel: projectionsOk,
    canComputePriceTargets,
    purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : 0,
    downPayment: Number.isFinite(downPayment) ? downPayment : 0,
    expectedSalePrice: Number.isFinite(expectedSalePrice) ? expectedSalePrice : 0,
    agentCommissionPct,
    closingCostsPct,
    repairsImprovements,
    targetProfitInput: targetProfitSafe,
    propertyTaxPaid,
    insurancePaid,
    hoaPaid,
    maintenanceTotal,
    gapBreakEvenVsExpected,
    minSalePriceNetProceedsZero,
    minSalePriceRecoverInvested: breakEvenSalePrice,
    profitVsExpected: trueProfit,
    remainingBalance,
  };
}

export function buildInsightLines(result) {
  const lines = [];
  const { netProceeds, trueProfit, totalInvested, expectedSalePrice, breakEvenSalePrice } = result;

  if (result.sellingCostBlocked && result.validationErrors.length === 0) {
    return ["Lower commission or closing cost percentages so their sum stays under 100%."];
  }

  if (!result.isValidModel) {
    if (result.validationErrors.length) {
      return ["Fix the highlighted inputs to see projections."];
    }
    return ["Check your inputs to see projections."];
  }

  if (netProceeds >= 0 && trueProfit >= 0) {
    lines.push(
      "At this sale price, you are profitable after recovering your invested cash (including ownership costs you entered).",
    );
  } else if (netProceeds >= 0 && trueProfit < 0) {
    lines.push(
      "You may receive cash at closing, but you are not truly profitable after counting the cash you put into the property.",
    );
  } else {
    lines.push(
      "Net proceeds are negative at this price—sale proceeds would not cover payoff and seller costs.",
    );
  }

  if (breakEvenSalePrice != null && expectedSalePrice > 0) {
    const diff = expectedSalePrice - breakEvenSalePrice;
    if (diff < 0) {
      lines.push(
        `Your break-even sale price (true profit $0) is higher than your expected sale price by ${formatUsd(-diff)}.`,
      );
    } else if (Math.abs(diff) < 500) {
      lines.push("Your expected sale price is very close to your true break-even price.");
    }
  }

  if (totalInvested <= 0 && trueProfit > 0 && netProceeds > 0) {
    lines.push(
      "You entered no ownership cash outlays; true profit mostly reflects sale proceeds minus payoff.",
    );
  }

  return lines;
}

function formatUsd(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
