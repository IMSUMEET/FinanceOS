import Papa from "papaparse";
import * as XLSX from "xlsx";
import { categorize, normalizeMerchant } from "./categorize";
import { summarizeTransactions } from "./analysisSummary";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const COLUMN_HINTS = {
  date: ["date", "posted", "transaction date", "trans date", "posting date", "trans. date"],
  merchant: ["merchant", "description", "name", "details"],
  amount: ["amount", "debit", "value", "amt"],
};

export function pickColumn(headers, hints) {
  const lc = headers.map((h) => String(h).toLowerCase().trim());
  for (const hint of hints) {
    const idx = lc.findIndex((h) => h === hint);
    if (idx !== -1) return headers[idx];
  }
  for (const hint of hints) {
    const idx = lc.findIndex((h) => h.includes(hint));
    if (idx !== -1) return headers[idx];
  }
  return headers[0];
}

export function detectFormat(headers, name = "") {
  const lc = headers.map((h) => String(h).toLowerCase().trim());
  const joined = lc.join("|");
  const has = (s) => joined.includes(s);

  if (has("appears on your statement as") && has("reference") && has("extended details")) {
    return "amex_credit_card";
  }
  if (
    has("date") &&
    has("description") &&
    has("amount") &&
    !has("location") &&
    name.toLowerCase().includes("amex")
  ) {
    return "amex_credit_card";
  }

  if (has("card no.") && has("debit") && has("credit")) {
    return "capital_one_credit_card";
  }

  if (has("status") && has("debit") && has("credit")) {
    return "citi_credit_card";
  }

  if (has("location") && has("category") && has("date") && has("description") && has("amount")) {
    return "playstation_credit_card";
  }

  if (
    has("trans. date") &&
    has("post date") &&
    has("description") &&
    has("amount") &&
    has("category")
  ) {
    return "discover_credit_card";
  }

  if (has("transaction date") && has("post date") && has("category")) {
    if (name.toLowerCase().includes("amazon")) {
      return "chase_amazon";
    }
    return "chase_credit_card";
  }

  if (
    (has("posting date") && has("balance") && has("type")) ||
    (has("details") && has("posting date") && has("balance") && has("status"))
  ) {
    return "chase_checking";
  }

  return "unknown";
}

export function parseToIsoDateString(dateStr) {
  const match = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const [_, month, day, year] = match;
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  const matchIso = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (matchIso) {
    const [_, year, month, day] = matchIso;
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  const parsed = Date.parse(dateStr);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString().split("T")[0];
  }
  return dateStr;
}

export function parseExcelDate(val) {
  const d = new Date(Math.round((val - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sheetToRows(worksheet) {
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!rawRows.length) return [];

  let headerIndex = -1;
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (Array.isArray(row)) {
      const rowStrings = row.map((cell) =>
        String(cell ?? "")
          .toLowerCase()
          .trim(),
      );
      const hasDate = rowStrings.some((s) => s.includes("date") || s.includes("trans"));
      const hasDesc = rowStrings.some((s) => s.includes("desc") || s.includes("merchant"));
      if (hasDate && hasDesc) {
        headerIndex = i;
        break;
      }
    }
  }

  if (headerIndex === -1) {
    headerIndex = rawRows.findIndex(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => cell !== null && cell !== undefined && cell !== ""),
    );
    if (headerIndex === -1) return [];
  }

  const headers = rawRows[headerIndex];
  const resultRows = [];
  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (Array.isArray(row)) {
      if (row.every((cell) => cell === null || cell === undefined || cell === "")) continue;

      const obj = {};
      headers.forEach((header, colIdx) => {
        if (header !== undefined && header !== null) {
          let val = row[colIdx];
          const hLower = String(header).toLowerCase();
          if ((hLower.includes("date") || hLower.includes("trans")) && typeof val === "number") {
            val = parseExcelDate(val);
          }
          obj[String(header)] = val;
        }
      });
      resultRows.push(obj);
    }
  }
  return resultRows;
}

export function parseRows(rows, format, fileName = "") {
  if (!rows.length) return { mapped: [], mapping: null };
  const headers = Object.keys(rows[0]);
  const mapping = {
    date: pickColumn(headers, COLUMN_HINTS.date),
    merchant: pickColumn(headers, COLUMN_HINTS.merchant),
    amount: pickColumn(headers, COLUMN_HINTS.amount),
  };
  const mapped = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lineNum = i + 2;
    try {
      const rawDate = String(r[mapping.date] ?? "").trim();
      if (!rawDate) {
        throw new Error(`Missing date value`);
      }
      const date = parseToIsoDateString(rawDate);
      if (isNaN(Date.parse(date))) {
        throw new Error(`Invalid date value "${rawDate}"`);
      }

      const merchantRaw = String(r[mapping.merchant] ?? "").trim();
      if (!merchantRaw) {
        throw new Error(`Missing merchant description`);
      }
      const merchantNorm = normalizeMerchant(merchantRaw);

      let amount = 0;
      if (format === "citi_credit_card") {
        const debitColumn = headers.find((h) => h.toLowerCase().trim() === "debit");
        const creditColumn = headers.find((h) => h.toLowerCase().trim() === "credit");
        const debitVal = debitColumn ? r[debitColumn] : null;
        const creditVal = creditColumn ? r[creditColumn] : null;
        const dNum =
          debitVal !== null && debitVal !== undefined && debitVal !== ""
            ? Number(String(debitVal).replace(/[$,]/g, ""))
            : null;
        const cNum =
          creditVal !== null && creditVal !== undefined && creditVal !== ""
            ? Number(String(creditVal).replace(/[$,]/g, ""))
            : null;
        if (cNum !== null && !isNaN(cNum) && cNum !== 0) {
          amount = -cNum;
        } else if (dNum !== null && !isNaN(dNum) && dNum !== 0) {
          amount = -dNum;
        } else {
          throw new Error(`Missing or invalid amount`);
        }
      } else if (format === "capital_one_credit_card") {
        const debitColumn = headers.find((h) => h.toLowerCase().trim() === "debit");
        const creditColumn = headers.find((h) => h.toLowerCase().trim() === "credit");
        const debitVal = debitColumn ? r[debitColumn] : null;
        const creditVal = creditColumn ? r[creditColumn] : null;
        const dNum =
          debitVal !== null && debitVal !== undefined && debitVal !== ""
            ? Number(String(debitVal).replace(/[$,]/g, ""))
            : null;
        const cNum =
          creditVal !== null && creditVal !== undefined && creditVal !== ""
            ? Number(String(creditVal).replace(/[$,]/g, ""))
            : null;
        if (cNum !== null && !isNaN(cNum) && cNum !== 0) {
          amount = cNum;
        } else if (dNum !== null && !isNaN(dNum) && dNum !== 0) {
          amount = -dNum;
        } else {
          throw new Error(`Missing or invalid amount`);
        }
      } else {
        const rawAmount = r[mapping.amount];
        const amt = Number(String(rawAmount ?? "").replace(/[$,]/g, ""));
        if (!Number.isFinite(amt)) {
          throw new Error(`Invalid amount value "${rawAmount}"`);
        }
        if (format === "amex_credit_card" || format === "discover_credit_card") {
          amount = -amt;
        } else if (
          format === "chase_checking" ||
          format === "chase_credit_card" ||
          format === "chase_amazon"
        ) {
          amount = amt;
        } else if (format === "playstation_credit_card") {
          const categoryCol =
            headers.find((h) => h.toLowerCase().trim() === "category") || "Category";
          const catVal = String(r[categoryCol] ?? "")
            .trim()
            .toLowerCase();
          if (catVal === "payment") {
            amount = amt;
          } else {
            amount = -amt;
          }
        } else {
          amount = amt > 0 ? -amt : amt;
        }
      }

      let card_identity = "Unknown";
      if (format === "amex_credit_card") card_identity = "Amex Blue Cash";
      else if (format === "chase_checking") card_identity = "Chase Checking";
      else if (format === "chase_credit_card") card_identity = "Chase Credit Card";
      else if (format === "chase_amazon") card_identity = "Chase Amazon";
      else if (format === "citi_credit_card") {
        card_identity = fileName.toLowerCase().includes("costco")
          ? "Costco Credit Card"
          : "Citi Reward+";
      } else if (format === "capital_one_credit_card") card_identity = "Venture X";
      else if (format === "playstation_credit_card") card_identity = "Playstation Credit Card";
      else if (format === "discover_credit_card") card_identity = "Discover Card";
      let category = categorize(merchantNorm, merchantRaw);
      if (format !== "chase_checking" && amount > 0) {
        category = "Credit Card Payments";
      }

      mapped.push({
        date,
        merchant_raw: merchantRaw,
        merchant_normalized: merchantNorm,
        description: merchantRaw,
        amount,
        currency: "USD",
        category,
        source: "csv-import",
        card_identity,
      });
    } catch (err) {
      const fileLabel = fileName ? `in "${fileName}" ` : "";
      throw new Error(`Error ${fileLabel}at line ${lineNum}: ${err.message}`);
    }
  }
  return { mapped, mapping };
}

export function validateCsvFiles(fileList) {
  const files = Array.from(fileList || []).filter(Boolean);
  if (!files.length) {
    return { ok: false, message: "Choose at least one CSV or Excel file." };
  }
  for (const f of files) {
    const name = (f.name || "").toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return { ok: false, message: "Only .csv, .xlsx, or .xls files are supported." };
    }
    if (f.size > MAX_FILE_BYTES) {
      return { ok: false, message: "Each file must be 5 MB or smaller." };
    }
  }
  return { ok: true, files };
}

export function parseOneCsvFile(file) {
  /* v8 ignore start -- browser FileReader path; covered via Sheet2/Transaction Details xlsx tests */
  return new Promise((resolve, reject) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          let sheetName = workbook.SheetNames[0];
          if (workbook.SheetNames.includes("Sheet2")) {
            sheetName = "Sheet2";
          } else if (workbook.SheetNames.includes("Transaction Details")) {
            sheetName = "Transaction Details";
          }
          const worksheet = workbook.Sheets[sheetName];
          const rows = sheetToRows(worksheet);
          resolve({ fileName: file.name, data: rows });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve({ fileName: file.name, data: result.data ?? [] }),
        error: (err) => reject(err),
      });
    }
  });
  /* v8 ignore stop */
}

export function stampIds(rows) {
  let id = 1;
  return rows.map((r) => ({
    ...r,
    id: id++,
    created_at: new Date(`${r.date}T12:00:00Z`).toISOString(),
  }));
}

export function buildMockAnalysisFromRows(allRows, fileMetas) {
  const stamped = stampIds(allRows);
  const summary = summarizeTransactions(stamped);
  const insights = [
    `Processed ${fileMetas.length} file(s) locally (mock mode).`,
    ...(summary.topCategories[0] ? [`Top category: ${summary.topCategories[0].category}.`] : []),
  ];
  return {
    status: "success",
    analysisId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    files: fileMetas,
    summary,
    transactions: stamped,
    insights,
  };
}
