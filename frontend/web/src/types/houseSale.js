/**
 * @typedef {Object} HouseSaleInputs
 * @property {number} purchasePrice
 * @property {number} downPayment
 * @property {string} purchaseDate  ISO date string (yyyy-mm-dd)
 * @property {number} annualInterestRate  APR as whole percent, e.g. 6.5
 * @property {number} loanTermYears
 * @property {number} expectedSalePrice
 * @property {number} agentCommissionRate  whole percent, e.g. 5.5 → use /100 in formulas
 * @property {number} sellerClosingCostRate  whole percent
 * @property {number} repairsImprovements
 * @property {number} annualPropertyTax
 * @property {number} annualInsurance
 * @property {number} monthlyHoa
 * @property {number} maintenanceTotal
 * @property {number} targetProfit
 */

/**
 * @typedef {Object} MortgageSummaryComputed
 * @property {number} originalLoanAmount
 * @property {number} monthlyPayment
 * @property {number} monthsElapsed
 * @property {number} yearsOwned
 * @property {number} remainingBalance
 * @property {number} principalPaidDown
 */

/**
 * @typedef {Object} HouseSaleResults
 * @property {MortgageSummaryComputed} mortgage
 * @property {number} agentCommission
 * @property {number} sellerClosingCosts
 * @property {number} totalSellingCosts
 * @property {number} netProceeds
 * @property {number} totalInvested
 * @property {number} trueProfit
 * @property {number|null} breakEvenSalePrice
 * @property {number|null} targetSalePrice
 * @property {number|null} roiPercent
 * @property {number|null} cashReturnedMultiple
 */

/** Empty form — merge fallbacks applied in HouseSaleCalculator. */
export const EMPTY_HOUSE_SALE_INPUT = {
  purchasePrice: "",
  downPayment: "",
  purchaseDate: "",
  annualInterestRate: "",
  loanTermYears: "",
  expectedSalePrice: "",
  agentCommissionPct: "",
  closingCostsPct: "",
  repairsImprovements: "",
  annualPropertyTax: "",
  annualInsurance: "",
  monthlyHoa: "",
  maintenanceTotal: "",
  targetProfit: "",
};

/** When commission / closing fields are left blank, assume these (industry defaults). */
export const HOUSE_SALE_RATE_DEFAULTS = {
  agentCommissionPct: 5.5,
  closingCostsPct: 1.5,
};

export const HOUSE_SALE_LOAN_DEFAULTS = {
  loanTermYears: 30,
};

/** Default & slider baseline for target true profit (USD). */
export const HOUSE_SALE_TARGET_PROFIT_DEFAULT = 50_000;

export const HOUSE_SALE_TARGET_PROFIT_SLIDER = {
  min: 0,
  max: 250_000,
  step: 5000,
};

/** Placeholder hints only (not submitted values). */
export const HOUSE_SALE_PLACEHOLDERS = {
  purchasePrice: "450000",
  downPayment: "90000",
  purchaseDate: "",
  annualInterestRate: "6.5",
  loanTermYears: "30",
  expectedSalePrice: "520000",
  agentCommissionPct: "5.5",
  closingCostsPct: "1.5",
  repairsImprovements: "0",
  annualPropertyTax: "0",
  annualInsurance: "0",
  monthlyHoa: "0",
  maintenanceTotal: "0",
  targetProfit: "50000",
};
