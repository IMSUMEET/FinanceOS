/**
 * FinanceOS shared type contracts (JSDoc).
 * The canonical schema lives in `./schema.json`. These typedefs mirror it so
 * editors give intellisense without TypeScript.
 *
 * @typedef {(
 *   "Food & Dining" | "Groceries" | "Transport" | "Shopping" | "Entertainment" |
 *   "Travel" | "Bills & Utilities" | "Health" | "Education" | "Subscriptions" |
 *   "Income" | "Other"
 * )} Category
 *
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} date - ISO date YYYY-MM-DD
 * @property {string} merchant
 * @property {string} merchant_normalized
 * @property {number} amount - positive for spend, negative for income / refund
 * @property {Category} category
 * @property {string|null} [notes]
 * @property {"manual"|"csv"|"bank_sync"|"seed"} [source]
 * @property {string} [created_at]
 *
 * @typedef {Object} TransactionImportRow
 * @property {string} date
 * @property {string} merchant
 * @property {number} amount
 * @property {Category} [category]
 * @property {string|null} [notes]
 *
 * @typedef {Object} TransactionImport
 * @property {TransactionImportRow[]} rows
 * @property {string} [source]
 *
 * @typedef {Object} Filters
 * @property {string} month - "YYYY-MM" or "ALL"
 * @property {Category[]} categories
 * @property {string} search
 *
 * @typedef {Object} Profile
 * @property {string} name
 * @property {string} handle
 * @property {"blue"|"violet"|"emerald"|"amber"} avatarVariant
 * @property {string} [email]
 * @property {boolean} profileCompleted
 *
 * @typedef {Object} Personality
 * @property {"foodie"|"shopper"|"traveler"|"homebody"|"subscriber"|"saver"} key
 * @property {string} label
 * @property {string} emoji
 * @property {string} [description]
 *
 * @typedef {Object} NotificationItem
 * @property {string} id
 * @property {"recurring"|"anomaly"|"mover"|"info"} kind
 * @property {string} title
 * @property {string} message
 * @property {string} created_at
 * @property {boolean} [read]
 *
 * @typedef {Object} MonthlyTotal
 * @property {string} month
 * @property {number} total
 * @property {number} [count]
 *
 * @typedef {Object} CategoryBreakdown
 * @property {Category} category
 * @property {number} total
 * @property {number} [share]
 * @property {number} [count]
 *
 * @typedef {Object} MerchantBreakdown
 * @property {string} merchant
 * @property {Category} [category]
 * @property {number} total
 * @property {number} count
 *
 * @typedef {Object} RecurringMerchant
 * @property {string} merchant
 * @property {"weekly"|"monthly"|"yearly"} cadence
 * @property {number} amount
 * @property {number} annualized
 * @property {string} [next_charge]
 *
 * @typedef {Object} Anomaly
 * @property {string} transaction_id
 * @property {string} reason
 * @property {"low"|"medium"|"high"} severity
 * @property {number} [deviation_pct]
 *
 * @typedef {Object} MoverEntry
 * @property {Category} category
 * @property {number} current
 * @property {number} prev
 * @property {number} deltaAbs
 * @property {number} deltaPct
 */

export const TYPE_NAMES = Object.freeze([
  "Transaction",
  "TransactionImport",
  "Filters",
  "Profile",
  "Personality",
  "NotificationItem",
  "MonthlyTotal",
  "CategoryBreakdown",
  "MerchantBreakdown",
  "RecurringMerchant",
  "Anomaly",
  "MoverEntry",
]);

export {};
