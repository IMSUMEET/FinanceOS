/**
 * Calendar months between purchase and `asOf` (year/month only).
 * @param {Date} purchaseDate
 * @param {Date} asOf
 * @returns {number} Non-negative month count; 0 if same month/year or purchase after asOf.
 */
export function calendarMonthsElapsed(purchaseDate, asOf) {
  if (!(purchaseDate instanceof Date) || Number.isNaN(purchaseDate.getTime())) return 0;
  if (!(asOf instanceof Date) || Number.isNaN(asOf.getTime())) return 0;
  if (purchaseDate > asOf) return 0;
  let months = (asOf.getFullYear() - purchaseDate.getFullYear()) * 12;
  months += asOf.getMonth() - purchaseDate.getMonth();
  return Math.max(0, months);
}

/**
 * @param {number} originalLoanAmount
 * @param {number} annualAprPercent  e.g. 6.5 for 6.5% APR
 * @param {number} loanTermMonths
 * @returns {number}
 */
export function computeMonthlyPayment(originalLoanAmount, annualAprPercent, loanTermMonths) {
  const P = Number(originalLoanAmount);
  const n = Math.floor(Number(loanTermMonths));
  if (!Number.isFinite(P) || P <= 0) return 0;
  if (!Number.isFinite(n) || n <= 0) return 0;

  const monthlyInterestRate = annualAprPercent / 100 / 12;

  if (monthlyInterestRate === 0) {
    return P / n;
  }

  const pow = Math.pow(1 + monthlyInterestRate, n);
  return (P * (monthlyInterestRate * pow)) / (pow - 1);
}

/**
 * Remaining balance after `monthsElapsed` payments (standard fixed-rate amortization).
 * @param {number} originalLoanAmount
 * @param {number} annualAprPercent
 * @param {number} loanTermMonths
 * @param {number} monthsElapsed  clamped 0..loanTermMonths by caller
 * @returns {number} >= 0
 */
export function computeRemainingBalance(originalLoanAmount, annualAprPercent, loanTermMonths, monthsElapsed) {
  const P = Number(originalLoanAmount);
  const n = Math.floor(Number(loanTermMonths));
  const t = Math.min(Math.max(0, Math.floor(Number(monthsElapsed))), n);
  if (!Number.isFinite(P) || P <= 0) return 0;
  if (!Number.isFinite(n) || n <= 0) return 0;

  const monthlyInterestRate = annualAprPercent / 100 / 12;

  if (monthlyInterestRate === 0) {
    const monthlyPayment = P / n;
    return Math.max(0, P - monthlyPayment * t);
  }

  const powN = Math.pow(1 + monthlyInterestRate, n);
  const powT = Math.pow(1 + monthlyInterestRate, t);
  return Math.max(0, (P * (powN - powT)) / (powN - 1));
}

/**
 * @param {object} p
 * @param {number} p.purchasePrice
 * @param {number} p.downPayment
 * @param {Date} p.purchaseDate
 * @param {number} p.annualInterestRateApr  whole percent, e.g. 6.5
 * @param {number} p.loanTermYears
 * @param {Date} [p.asOf]
 * @returns {{ originalLoanAmount: number, monthlyPayment: number, monthsElapsed: number, yearsOwned: number, remainingBalance: number, principalPaidDown: number }}
 */
export function computeMortgageSummary({
  purchasePrice,
  downPayment,
  purchaseDate,
  annualInterestRateApr,
  loanTermYears,
  asOf = new Date(),
}) {
  const price = Number(purchasePrice);
  const down = Number(downPayment);
  const originalLoanAmount = Math.max(0, price - down);
  const loanTermMonths = Math.max(0, Math.floor(Number(loanTermYears) * 12));

  const rawMonths = calendarMonthsElapsed(purchaseDate, asOf);
  const monthsElapsed = loanTermMonths > 0 ? Math.min(rawMonths, loanTermMonths) : 0;

  const monthlyPayment = computeMonthlyPayment(
    originalLoanAmount,
    Number(annualInterestRateApr),
    loanTermMonths,
  );

  const remainingBalance = computeRemainingBalance(
    originalLoanAmount,
    Number(annualInterestRateApr),
    loanTermMonths,
    monthsElapsed,
  );

  const principalPaidDown = Math.max(0, originalLoanAmount - remainingBalance);
  const yearsOwned = monthsElapsed / 12;

  return {
    originalLoanAmount,
    monthlyPayment,
    monthsElapsed,
    yearsOwned,
    remainingBalance,
    principalPaidDown,
  };
}
