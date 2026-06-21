import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Trash2, UploadCloud, Wand2, Loader2, FolderOpen } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Pill from "../components/ui/Pill";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import { useTransactions } from "../context/useTransactions";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { categorize, normalizeMerchant } from "../utils/categorize";
import { USE_MOCK } from "../api/client";
import { analyzeCsvFormData } from "../services/analysis";
import { summarizeTransactions } from "../utils/analysisSummary";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const COLUMN_HINTS = {
  date: ["date", "posted", "transaction date", "trans date", "posting date", "trans. date"],
  merchant: ["merchant", "description", "name", "details"],
  amount: ["amount", "debit", "value", "amt"],
};

function pickColumn(headers, hints) {
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

function detectFormat(headers, name = "") {
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

function parseToIsoDateString(dateStr) {
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

function parseExcelDate(val) {
  const d = new Date(Math.round((val - 25569) * 86400 * 1000));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sheetToRows(worksheet) {
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

function parseRows(rows, format, fileName = "") {
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

function validateCsvFiles(fileList) {
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

function parseOneCsvFile(file) {
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
}

function stampIds(rows) {
  let id = 1;
  return rows.map((r) => ({
    ...r,
    id: id++,
    created_at: new Date(`${r.date}T12:00:00Z`).toISOString(),
  }));
}

function buildMockAnalysisFromRows(allRows, fileMetas) {
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

const FORMAT_LABELS = {
  amex_credit_card: { label: "Amex Blue Cash", tone: "brand" },
  chase_amazon: { label: "Chase Amazon", tone: "warn" },
  chase_credit_card: { label: "Chase Credit Card", tone: "dark" },
  chase_checking: { label: "Chase Checking", tone: "success" },
  citi_credit_card: { label: "Citi / Costco", tone: "brand" },
  capital_one_credit_card: { label: "Venture X", tone: "warn" },
  playstation_credit_card: { label: "Playstation Card", tone: "dark" },
  discover_credit_card: { label: "Discover Card", tone: "success" },
  unknown: { label: "Unknown Format", tone: "neutral" },
};

function UploadPage() {
  useDocumentTitle("Import");
  const navigate = useNavigate();
  const { transactions, applyAnalysisResult, clearSessionAnalysis, restoredFromStorage } =
    useTransactions();

  const [phase, setPhase] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [lastSummary, setLastSummary] = useState(null);
  const inputRef = useRef(null);
  const folderInputRef = useRef(null);

  const resetFlow = useCallback(() => {
    setPhase("idle");
    setErrorMessage("");
    setPendingFiles([]);
    setLastSummary(null);
    if (inputRef.current) inputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  }, []);

  const onChooseFiles = useCallback(async (fileList) => {
    const v = validateCsvFiles(fileList);
    if (!v.ok) {
      setPhase("error");
      setErrorMessage(v.message);
      setPendingFiles([]);
      return;
    }
    setPhase("idle");
    setErrorMessage("");

    try {
      const prepared = await Promise.all(
        v.files.map(async (file) => {
          const parsed = await parseOneCsvFile(file);
          const headers = parsed.data.length ? Object.keys(parsed.data[0]) : [];
          const fmt = detectFormat(headers, file.name);
          const { mapped } = parseRows(parsed.data, fmt, file.name);
          return {
            file,
            name: file.name,
            size: file.size,
            detectedFormat: fmt,
            rowCount: mapped.length,
            parsedData: parsed.data,
          };
        }),
      );
      setPendingFiles(prepared);
    } catch (e) {
      setPhase("error");
      setErrorMessage("Error reading CSV files: " + e.message);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!pendingFiles.length) {
      setPhase("error");
      setErrorMessage("Choose at least one CSV file.");
      return;
    }

    try {
      if (!USE_MOCK) {
        setPhase("uploading");
        const fd = new FormData();
        for (const pf of pendingFiles) {
          fd.append("files", pf.file, pf.name);
        }
        setPhase("analyzing");
        const result = await analyzeCsvFormData(fd);
        if (result.status !== "success") {
          throw new Error(result.message || "Analysis failed.");
        }
        await applyAnalysisResult(result);
        setPendingFiles([]);
        navigate("/");
        return;
      }

      setPhase("uploading");
      // Short delay for UI feel
      await new Promise((r) => setTimeout(r, 600));
      setPhase("analyzing");
      await new Promise((r) => setTimeout(r, 600));

      const fileMetas = [];
      const allRows = [];
      for (const pf of pendingFiles) {
        const { mapped } = parseRows(pf.parsedData, pf.detectedFormat, pf.name);
        allRows.push(...mapped);
        fileMetas.push({
          fileName: pf.name,
          rowCount: mapped.length,
          detectedFormat: pf.detectedFormat,
        });
      }
      const analysis = buildMockAnalysisFromRows(allRows, fileMetas);
      await applyAnalysisResult(analysis);
      setPendingFiles([]);
      navigate("/");
    } catch (e) {
      const msg =
        e?.message || (typeof e === "string" ? e : "Something went wrong. Please try again.");
      setPhase("error");
      setErrorMessage(msg);
    }
  }, [pendingFiles, applyAnalysisResult, navigate]);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChooseFiles(e.dataTransfer.files);
  };

  const dragOver = useRef(false);
  const [dragHighlight, setDragHighlight] = useState(false);

  return (
    <section className="space-y-5 pt-2">
      {restoredFromStorage ? (
        <p className="rounded-xl2 border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
          Restored your saved data from this device.
        </p>
      ) : null}

      <Card>
        <SectionHeader
          eyebrow="Bring your data"
          title="Import transactions from CSV"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="soft">{transactions.length} in store</Pill>
              {transactions.length > 0 ? (
                <Button variant="ghost" icon={Trash2} onClick={clearSessionAnalysis}>
                  Clear all data
                </Button>
              ) : null}
            </div>
          }
        />

        <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
          Files are parsed on this device. Nothing is uploaded to our servers unless you connect a
          backend API.
        </p>
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
          Supported exports from Chase, Amex, Citi, Capital One, Discover, and generic CSV. Max 5 MB
          per file.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragOver.current) {
              dragOver.current = true;
              setDragHighlight(true);
            }
          }}
          onDragLeave={() => {
            dragOver.current = false;
            setDragHighlight(false);
          }}
          onDrop={(e) => {
            dragOver.current = false;
            setDragHighlight(false);
            onDrop(e);
          }}
          className={[
            "mt-6 flex flex-col items-center justify-center gap-3 rounded-xl3 border-2 border-dashed px-6 py-12 text-center transition",
            dragHighlight
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
              : "border-ink-200 bg-white/60 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-800/40",
          ].join(" ")}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-brand">
            <UploadCloud size={24} />
          </div>
          <p className="text-lg font-black text-ink-900 dark:text-ink-50">
            Drop CSV or Excel files here
          </p>
          <p className="max-w-md text-sm text-ink-500 dark:text-ink-400">
            {!USE_MOCK
              ? "Files are sent to your configured API (multipart) and analyzed on the server."
              : "Mock mode: CSVs/Excel files are parsed in your browser only."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              onClick={() => inputRef.current?.click()}
              icon={FileSpreadsheet}
              disabled={phase === "uploading" || phase === "analyzing"}
            >
              Choose files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              multiple
              className="hidden"
              onChange={(e) => onChooseFiles(e.target.files)}
            />
            <Button
              onClick={() => folderInputRef.current?.click()}
              icon={FolderOpen}
              disabled={phase === "uploading" || phase === "analyzing"}
            >
              Choose folder
            </Button>
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={(e) => onChooseFiles(e.target.files)}
            />
            {pendingFiles.length ? (
              <Button
                onClick={runAnalysis}
                icon={phase === "uploading" || phase === "analyzing" ? Loader2 : Wand2}
                className={
                  phase === "uploading" || phase === "analyzing" ? "[&_svg]:animate-spin" : ""
                }
                disabled={phase === "uploading" || phase === "analyzing"}
              >
                {phase === "uploading"
                  ? "Uploading…"
                  : phase === "analyzing"
                    ? "Analyzing…"
                    : "Run analysis"}
              </Button>
            ) : null}
          </div>
          {pendingFiles.length ? (
            <div className="mt-8 w-full max-w-2xl overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50 text-xs font-semibold text-ink-500 uppercase tracking-wider dark:border-ink-800 dark:bg-ink-950/20 dark:text-ink-400">
                    <th className="px-5 py-3.5">File Name</th>
                    <th className="px-5 py-3.5">Detected Card / Format</th>
                    <th className="px-5 py-3.5 text-right">Rows</th>
                    <th className="px-5 py-3.5 text-right">Size</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800/80 text-sm">
                  {pendingFiles.map((pf, idx) => {
                    const labelInfo = FORMAT_LABELS[pf.detectedFormat] || FORMAT_LABELS.unknown;
                    return (
                      <tr
                        key={pf.name + idx}
                        className="hover:bg-ink-50/30 dark:hover:bg-ink-950/10"
                      >
                        <td
                          className="px-5 py-3.5 font-medium text-ink-900 dark:text-ink-50 truncate max-w-[200px]"
                          title={pf.name}
                        >
                          {pf.name}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={labelInfo.tone}>{labelInfo.label}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-ink-600 dark:text-ink-300">
                          {pf.rowCount}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-ink-500 dark:text-ink-400">
                          {(pf.size / 1024).toFixed(1)} KB
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-350 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Remove file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </Card>

      {phase === "success" && lastSummary ? (
        <Card>
          <EmptyState
            icon={Wand2}
            title={`${lastSummary.totalTransactions} transactions analyzed`}
            description="Head to Overview, Transactions or Insights to explore results."
            action={<Button onClick={resetFlow}>Analyze more</Button>}
          />
        </Card>
      ) : null}

      {phase === "error" ? (
        <Card>
          <EmptyState
            icon={Trash2}
            title="Could not analyze"
            description={errorMessage}
            action={<Button onClick={resetFlow}>Try again</Button>}
          />
        </Card>
      ) : null}
    </section>
  );
}

export default UploadPage;
