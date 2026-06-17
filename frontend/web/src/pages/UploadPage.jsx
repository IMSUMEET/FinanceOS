import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { Database, FileSpreadsheet, Trash2, UploadCloud, Wand2, Loader2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Pill from "../components/ui/Pill";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import { useTransactions } from "../context/useTransactions";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { categorize, normalizeMerchant } from "../utils/categorize";
import seed from "../data/mockTransactions";
import { USE_MOCK } from "../api/client";
import { analyzeCsvFormData } from "../services/analysis";
import { summarizeTransactions } from "../utils/analysisSummary";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const COLUMN_HINTS = {
  date: ["date", "posted", "transaction date", "trans date", "posting date"],
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
  const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [_, month, day, year] = match;
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  const matchIso = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
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
    const lineNum = i + 2; // Row index is 0-indexed, so row + 2 accounts for 1-based index and header row
    try {
      const rawAmount = r[mapping.amount];
      const amt = Number(String(rawAmount ?? "").replace(/[$,]/g, ""));
      if (!Number.isFinite(amt)) {
        throw new Error(`Invalid amount value "${rawAmount}"`);
      }
      const merchantRaw = String(r[mapping.merchant] ?? "").trim();
      const merchantNorm = normalizeMerchant(merchantRaw);
      const rawDate = String(r[mapping.date] ?? "").trim();
      if (!rawDate) {
        throw new Error(`Missing date value`);
      }
      if (!merchantRaw) {
        throw new Error(`Missing merchant description`);
      }

      const date = parseToIsoDateString(rawDate);
      if (isNaN(Date.parse(date))) {
        throw new Error(`Invalid date value "${rawDate}"`);
      }

      let amount = amt;
      if (format === "amex_credit_card") {
        amount = -amt;
      } else if (format === "chase_checking" || format === "chase_credit_card" || format === "chase_amazon") {
        amount = amt;
      } else {
        amount = amt > 0 ? -amt : amt;
      }

      let card_identity = "Unknown";
      if (format === "amex_credit_card") card_identity = "Amex Blue Cash";
      else if (format === "chase_checking") card_identity = "Chase Checking";
      else if (format === "chase_credit_card") card_identity = "Chase Credit Card";
      else if (format === "chase_amazon") card_identity = "Chase Amazon";

      mapped.push({
        date,
        merchant_raw: merchantRaw,
        merchant_normalized: merchantNorm,
        description: merchantRaw,
        amount,
        currency: "USD",
        category: categorize(merchantNorm, merchantRaw),
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
    return { ok: false, message: "Choose at least one CSV file." };
  }
  for (const f of files) {
    const name = (f.name || "").toLowerCase();
    if (!name.endsWith(".csv")) {
      return { ok: false, message: "Only .csv files are supported." };
    }
    if (f.size > MAX_FILE_BYTES) {
      return { ok: false, message: "Each file must be 5 MB or smaller." };
    }
  }
  return { ok: true, files };
}

function parseOneCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve({ fileName: file.name, data: result.data ?? [] }),
      error: (err) => reject(err),
    });
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
    ...(summary.topCategories[0]
      ? [`Top category: ${summary.topCategories[0].category}.`]
      : []),
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
  unknown: { label: "Unknown Format", tone: "neutral" },
};

function UploadPage() {
  useDocumentTitle("Import");
  const {
    transactions,
    applyAnalysisResult,
    clearSessionAnalysis,
    restoredFromSession,
    replaceAll,
  } = useTransactions();

  const [phase, setPhase] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [lastSummary, setLastSummary] = useState(null);
  const inputRef = useRef(null);

  const resetFlow = useCallback(() => {
    setPhase("idle");
    setErrorMessage("");
    setPendingFiles([]);
    setLastSummary(null);
    if (inputRef.current) inputRef.current.value = "";
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
        })
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
        setLastSummary(result.summary);
        setPhase("success");
        setPendingFiles([]);
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
      setLastSummary(analysis.summary);
      setPhase("success");
      setPendingFiles([]);
    } catch (e) {
      const msg =
        e?.message ||
        (typeof e === "string" ? e : "Something went wrong. Please try again.");
      setPhase("error");
      setErrorMessage(msg);
    }
  }, [pendingFiles, applyAnalysisResult]);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChooseFiles(e.dataTransfer.files);
  };

  const loadDemo = useCallback(async () => {
    await clearSessionAnalysis();
    if (!USE_MOCK) {
      await replaceAll(seed);
    }
    setPhase("success");
    setLastSummary(summarizeTransactions(seed));
    setPendingFiles([]);
  }, [clearSessionAnalysis, replaceAll]);

  const dragOver = useRef(false);
  const [dragHighlight, setDragHighlight] = useState(false);

  return (
    <section className="space-y-5 pt-2">
      {restoredFromSession ? (
        <p className="rounded-xl2 border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
          Restored from this browser session.
        </p>
      ) : null}

      <Card>
        <SectionHeader
          eyebrow="Bring your data"
          title="Import transactions from CSV"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="soft">{transactions.length} in store</Pill>
              <Button variant="ghost" icon={Database} onClick={loadDemo}>
                Load demo
              </Button>
              <Button variant="ghost" icon={Trash2} onClick={clearSessionAnalysis}>
                Clear session data
              </Button>
            </div>
          }
        />

        <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
          Files are processed in memory and not stored on our servers.
        </p>
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
          For now, uploads are limited to 5 MB per file. Larger files will need S3-based async processing
          later.
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
          <p className="text-lg font-black text-ink-900 dark:text-ink-50">Drop CSV files here</p>
          <p className="max-w-md text-sm text-ink-500 dark:text-ink-400">
            {!USE_MOCK
              ? "Files are sent to your configured API (multipart) and analyzed on the server."
              : "Mock mode: CSVs are parsed in your browser only."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              onClick={() => inputRef.current?.click()}
              icon={FileSpreadsheet}
              disabled={phase === "uploading" || phase === "analyzing"}
            >
              Choose CSVs
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
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
                      <tr key={pf.name + idx} className="hover:bg-ink-50/30 dark:hover:bg-ink-950/10">
                        <td className="px-5 py-3.5 font-medium text-ink-900 dark:text-ink-50 truncate max-w-[200px]" title={pf.name}>
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
                              setPendingFiles(prev => prev.filter((_, i) => i !== idx));
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
