const RULES: [RegExp, string][] = [
  [
    /(\brent\b|\bmortgage\b|\bhoa\b|\bhome\s*repair\b|\bplumbing\b|\bhauling\b|\bhandyman\b|\blawn\b|\bpest\b)/i,
    "Housing",
  ],
  [
    /(\bwhole\s*foods\b|\btrader\s*joe|\bcostco\s*whse\b|\bcostco\b|\bwalmart\b|\bwal-mart\b|\bgrocery\b|\bsafeway\b|\bkroger\b|\baldi\b|\bsprouts\b|\bapna\s*bazar\b|\bmetro\s*hyper\b|\bfred-meyer\b|\bmayuri\s*foods\b|\buber\s*eats\b|\bdoordash\b|\bgrubhub\b|\bpostmates\b|\bcaviar\b|\bstarbucks\b|\bcoffee\b|\bmcdonald|burger\s*king|\bchipotle\b|\brestaurant\b|\bdelivery\b|\bdunkin\b|\bsweetgreen\b|\bpizza\b|\bhonest\b|\bdeli\b|\bgrill\b|\bbiryani\b|\bbroiler\b|\bsoups\b|\bsubway\b|\bcafe\b|\bpotbelly\b|\btaco\b|\bwendy\b|\bapplebee\b|\bsake\s*house\b|\bramen\b|\bbakery\b|\btadka\b|\bjamba\s*juice\b|\bhuxdotter\b)/i,
    "Food",
  ],
  [
    /(\bchevron\b|\bshell\b|exxon|mobil\b|\bgas\b|\bfuel\b|\bbp\b|\barco\b|\bcostco\s*gas\b|\buber\b|\blyft\b|\btaxi\b|\bbart\b|\bmta\b|\btransit\b|\bparking\b|\bace\s*parking\b|\bipm\b|\bgoodtogo\b|\betoll\b|\btoll\b|\bpayup\b|\bautozone\b|\bmechanic\b|\bcar\s*wash\b)/i,
    "Transportation",
  ],
  [
    /(\bamazon\b|\bamzn\b|\btarget\b|\bbest\s*buy\b|\bnike\b|\bzara\b|\buniqlo\b|\bshopping\b|\betsy\b|\bsephora\b|\bhome\s*depot\b|\bunder\s*armour\b|\brevo\b)/i,
    "Shopping",
  ],
  [
    /(\bmovie\b|\bcinema\b|\bgame\b|\bsteam\b|\bplaystation\b|\bxbox\b|\bentertainment\b|\bspirit\b|\bbar\b|\bbadminton\b|\bconcert\b|\bticketmaster\b)/i,
    "Entertainment",
  ],
  [
    /(\bairline\b|\bflight\b|\bhotel\b|\bairbnb\b|\bexpedia\b|\bdelta\b|\bunited\b|\bsouthwest\b|\btravel\b|\bavis\b|\bvfs\b|\bresort\b)/i,
    "Travel",
  ],
  [
    /(\belectric\b|\bwater\b|\bgas\s*company\b|\butility\b|\binternet\b|\bphone\b|\bverizon\b|\bat&t\b|\bcomcast\b|\bxfinity\b|\bt-mobile\b|\bpuget\s*sound\s*energy\b|\bpse\b|\bcity\s*of\s*auburn\b|\bwaste\s*mgmt\b|\bwaste\s*management\b|\bnetflix\b|\bspotify\b|\bhulu\b|\bdisney\s*plus\b|\bprime\s*membership\b|\byoutube\s*premium\b|\bicloud\b|\bapple\.com\/bill\b)/i,
    "Bills & Utilities",
  ],
  [
    /(\bdoctor\b|\bdental\b|\bmedical\b|\bpharmacy\b|\bcvs\b|\bwalgreens\b|\bgym\b|\bfitness\b|\bspa\b|\bsalon\b|\bbarber\b|\bgrooming\b|\bhealth\b)/i,
    "Health & Personal",
  ],
  [
    /(\bgift\b|\bdonation\b|\bcharity\b|\bgofundme\b|\bchurch\b|\btemple\b|\bfamily\b)/i,
    "Family & Giving",
  ],
];

export function mapCanonicalCategory(catName: string): string {
  if (!catName) return "Other";
  const c = String(catName).trim().toLowerCase();

  // Income categories
  if (
    c.includes("salary") ||
    c.includes("payroll") ||
    c.includes("wages") ||
    c.includes("employer")
  )
    return "Salary";
  if (
    c.includes("investment") ||
    c.includes("dividend") ||
    c.includes("interest") ||
    c.includes("capital gain")
  )
    return "Investment Income";
  if (
    c.includes("business") ||
    c.includes("freelance") ||
    c.includes("consulting") ||
    c.includes("side project")
  )
    return "Business Income";
  if (c.includes("reimbursement") || c.includes("reimburse") || c.includes("expense claim"))
    return "Reimbursements";
  if (c.includes("income") || c.includes("cashback") || c.includes("reward")) return "Other Income";

  // Transfer categories
  if (c.includes("transfer") || c.includes("internal transfer") || c.includes("brokerage funding"))
    return "Internal Transfer";

  // Debt Payment categories
  if (c.includes("credit card payment") || c.includes("card payment") || c.includes("credit card"))
    return "Credit Card Payment";
  if (c.includes("loan") || c.includes("emi") || c.includes("mortgage principal"))
    return "Loan Payment";

  // Refund categories
  if (c.includes("refund") || c.includes("reversal")) return "Refund";

  // Expense categories
  if (c.includes("housing") || c.includes("rent") || c.includes("mortgage") || c.includes("home"))
    return "Housing";
  if (
    c.includes("food") ||
    c.includes("grocery") ||
    c.includes("groceries") ||
    c.includes("supermarket") ||
    c.includes("restaurant") ||
    c.includes("dining") ||
    c.includes("fast food") ||
    c.includes("bakery") ||
    c.includes("coffee")
  )
    return "Food";
  if (
    c.includes("transport") ||
    c.includes("gas") ||
    c.includes("transit") ||
    c.includes("parking") ||
    c.includes("cab") ||
    c.includes("vehicle") ||
    c.includes("car")
  )
    return "Transportation";
  if (
    c.includes("shopping") ||
    c.includes("department store") ||
    c.includes("hardware") ||
    c.includes("merchandise")
  )
    return "Shopping";
  if (
    c.includes("entertainment") ||
    c.includes("movie") ||
    c.includes("fun") ||
    c.includes("game") ||
    c.includes("art") ||
    c.includes("digital purchase")
  )
    return "Entertainment";
  if (c.includes("travel") || c.includes("flight") || c.includes("hotel") || c.includes("airline"))
    return "Travel";
  if (
    c.includes("bill") ||
    c.includes("utility") ||
    c.includes("utilities") ||
    c.includes("cable") ||
    c.includes("telecom") ||
    c.includes("phone") ||
    c.includes("subscription")
  )
    return "Bills & Utilities";
  if (
    c.includes("health") ||
    c.includes("medical") ||
    c.includes("personal") ||
    c.includes("gym") ||
    c.includes("pharmacy") ||
    c.includes("dental")
  )
    return "Health & Personal";
  if (c.includes("family") || c.includes("gift") || c.includes("donation") || c.includes("charity"))
    return "Family & Giving";

  return "Other";
}

export function categorize(merchant: string, description: string): string {
  const text = ` ${merchant ?? ""} ${description ?? ""} `.toLowerCase();
  for (const [re, cat] of RULES) {
    if (re.test(text)) return cat;
  }
  return "Other";
}

export function normalizeMerchant(raw: string): string {
  if (!raw) return "Unknown";
  let s = String(raw)
    .replace(/\d{4,}/g, "")
    .replace(/\*[A-Z0-9]+/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[*#@]/g, "")
    .trim();
  s = s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
  return s || "Unknown";
}
