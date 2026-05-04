import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { Database, FileSpreadsheet, Trash2, UploadCloud, Wand2, Loader2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Pill from "../components/ui/Pill";
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
  date: ["date", "posted", "transaction date", "trans date"],
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

function parseRows(rows) {
  if (!rows.length) return { mapped: [], mapping: null };
  const headers = Object.keys(rows[0]);
  const mapping = {
    date: pickColumn(headers, COLUMN_HINTS.date),
    merchant: pickColumn(headers, COLUMN_HINTS.merchant),
    amount: pickColumn(headers, COLUMN_HINTS.amount),
  };
  const mapped = rows
    .map((r) => {
      const rawAmount = r[mapping.amount];
      const amt = Number(String(rawAmount ?? "").replace(/[$,]/g, ""));
      if (!Number.isFinite(amt)) return null;
      const merchantRaw = String(r[mapping.merchant] ?? "").trim();
      const merchantNorm = normalizeMerchant(merchantRaw);
      const date = String(r[mapping.date] ?? "").trim();
      if (!date || !merchantRaw) return null;
      return {
        date,
        merchant_raw: merchantRaw,
        merchant_normalized: merchantNorm,
        description: merchantRaw,
        amount: amt > 0 ? -amt : amt,
        currency: "USD",
        category: categorize(merchantNorm, merchantRaw),
        source: "csv-import",
      };
    })
    .filter(Boolean);
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

  const onChooseFiles = useCallback((fileList) => {
    const v = validateCsvFiles(fileList);
    if (!v.ok) {
      setPhase("error");
      setErrorMessage(v.message);
      setPendingFiles([]);
      return;
    }
    setPhase("idle");
    setErrorMessage("");
    setPendingFiles(v.files);
  }, []);

  const runAnalysis = useCallback(async () => {
    const v = validateCsvFiles(pendingFiles);
    if (!v.ok) {
      setPhase("error");
      setErrorMessage(v.message);
      return;
    }
    const files = v.files;

    try {
      if (!USE_MOCK) {
        setPhase("uploading");
        const fd = new FormData();
        for (const f of files) {
          fd.append("files", f, f.name);
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
      const parts = await Promise.all(files.map((f) => parseOneCsvFile(f)));
      setPhase("analyzing");
      const fileMetas = [];
      const allRows = [];
      for (const { fileName, data } of parts) {
        const { mapped } = parseRows(data);
        allRows.push(...mapped);
        fileMetas.push({
          fileName,
          rowCount: mapped.length,
          detectedFormat: "unknown",
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
            <ul className="mt-2 max-w-md text-left text-xs text-ink-600 dark:text-ink-300">
              {pendingFiles.map((f) => (
                <li key={f.name + f.size}>
                  {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
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
