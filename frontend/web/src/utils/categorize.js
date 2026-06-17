// Mirror of backend/app/features/spend_analyzer/modules/categorizer.py
const RULES = [
  [/(\bnetflix\b|\bspotify\b|\bhulu\b|\bdisney\s*plus\b|\bprime\s*membership\b|\byoutube\s*premium\b|\bicloud\b|\bapple\.com\/bill\b)/i, "Subscriptions"],
  [/(\bwhole\s*foods\b|\btrader\s*joe|\bcostco\s*whse\b|\bcostco\b|\bwalmart\b|\bwal-mart\b|\bgrocery\b|\bsafeway\b|\bkroger\b|\baldi\b|\bsprouts\b|\bapna\s*bazar\b|\bmetro\s*hyper\b|\bfred-meyer\b|\bmayuri\s*foods\b)/i, "Groceries"],
  [/(\bchevron\b|\bshell\b|exxon|mobil\b|\bgas\b|\bfuel\b|\bbp\b|\barco\b|\bcostco\s*gas\b)/i, "Gas"],
  [/(\buber\s*eats\b|\bdoordash\b|\bgrubhub\b|\bpostmates\b|\bcaviar\b)/i, "Food"],
  [/(\buber\b|\blyft\b|\btaxi\b|\bbart\b|\bmta\b|\btransit\b|\bparking\b|\bace\s*parking\b|\bipm\b|\bgoodtogo\b|\betoll\b|\btoll\b|\bpayup\b)/i, "Transport"],
  [/(\bairline\b|\bflight\b|\bhotel\b|\bairbnb\b|\bexpedia\b|\bdelta\b|\bunited\b|\bsouthwest\b|\btravel\b|\bavis\b|\bvfs\b)/i, "Travel"],
  [/(\bstarbucks\b|\bcoffee\b|\bmcdonald|burger\s*king|\bchipotle\b|\brestaurant\b|\bdelivery\b|\bdunkin\b|\bsweetgreen\b|\bpizza\b|\bhonest\b|\bdeli\b|\bgrill\b|\bbiryani\b|\bbroiler\b|\bsoups\b|\bsubway\b|\bcafe\b|\bpotbelly\b|\btaco\b|\bwendy\b|\bapplebee\b|\bsake\s*house\b|\bramen\b|\bbakery\b|\btadka\b|\bjamba\s*juice\b|\bhuxdotter\b)/i, "Food"],
  [/(\bamazon\b|\bamzn\b|\btarget\b|\bbest\s*buy\b|\bnike\b|\bzara\b|\buniqlo\b|\bshopping\b|\betsy\b|\bsephora\b|\bhome\s*depot\b|\bunder\s*armour\b|\brevo\b)/i, "Shopping"],
  [/(\bmovie\b|\bcinema\b|\bgame\b|\bsteam\b|\bplaystation\b|\bxbox\b|\bentertainment\b|\bspirit\b|\bbar\b|\bbadminton\b)/i, "Entertainment"],
  [/(\belectric\b|\bwater\b|\bgas\s*company\b|\butility\b|\binternet\b|\bphone\b|\bverizon\b|\bat&t\b|\bcomcast\b|\bxfinity\b|\bt-mobile\b|\bpuget\s*sound\s*energy\b|\bpse\b|\bcity\s*of\s*auburn\b|\bwaste\s*mgmt\b|\bwaste\s*management\b)/i, "Utilities"],
  [/(\bthank\s*you\b|\bautopay\b|\bdirectpay\b|mobile\s*pymt|online\s*pymt|mobile\s*payment|online\s*payment)/i, "Credit Card Payments"],
  [/(\bpayment\b|\bpymt\b|\bcrdt\b|\bcredit\b|\brefund\b)/i, "Payments"],
];

export function categorize(merchant, description) {
  const text = ` ${merchant ?? ""} ${description ?? ""} `.toLowerCase();
  for (const [re, cat] of RULES) {
    if (re.test(text)) return cat;
  }
  return "Other";
}

export function normalizeMerchant(raw) {
  if (!raw) return "Unknown";
  let s = String(raw)
    .replace(/\d{4,}/g, "")
    .replace(/\*[A-Z0-9]+/gi, "")
    .replace(/\s+/g, " ")
    .replace(/[*#@]/g, "")
    .trim();
  // Title-case-ish
  s = s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return s || "Unknown";
}
