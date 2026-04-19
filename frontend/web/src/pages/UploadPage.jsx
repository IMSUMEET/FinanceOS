import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { Database, FileSpreadsheet, Trash2, UploadCloud, Wand2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Pill from "../components/ui/Pill";
import Badge from "../components/ui/Badge";
import CategoryDot from "../components/ui/CategoryDot";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import { useTransactions } from "../context/useTransactions";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { categorize, normalizeMerchant } from "../utils/categorize";
import seed from "../data/mockTransactions";
import { formatAmountSpend, formatDate } from "../utils/format";

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

function UploadPage() {
  useDocumentTitle("Import");
  const { addMany, replaceAll, transactions } = useTransactions();
  const [stage, setStage] = useState({ status: "idle" }); // idle | preview | done
  const [parsed, setParsed] = useState({ rows: [], mapping: null, fileName: "" });
  const [mode, setMode] = useState("append");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const onFile = useCallback((file) => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const { mapped, mapping } = parseRows(result.data ?? []);
        setParsed({ rows: mapped, mapping, fileName: file.name });
        setStage({ status: "preview" });
      },
      error: (err) => {
        setStage({ status: "error", message: err.message ?? "Could not read CSV." });
      },
    });
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    onFile(file);
  };

  const commit = () => {
    if (!parsed.rows.length) return;
    if (mode === "replace") replaceAll(parsed.rows);
    else addMany(parsed.rows);
    setStage({ status: "done", count: parsed.rows.length });
    setParsed({ rows: [], mapping: null, fileName: "" });
  };

  const loadDemo = () => {
    replaceAll(seed);
    setStage({ status: "done", count: seed.length, demo: true });
  };

  const reset = () => {
    setParsed({ rows: [], mapping: null, fileName: "" });
    setStage({ status: "idle" });
  };

  return (
    <section className="space-y-5 pt-2">
      <Card>
        <SectionHeader
          eyebrow="Bring your data"
          title="Import transactions from CSV"
          action={
            <div className="flex items-center gap-2">
              <Pill tone="soft">{transactions.length} in store</Pill>
              <Button variant="ghost" icon={Database} onClick={loadDemo}>
                Reset demo
              </Button>
            </div>
          }
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={[
            "mt-6 flex flex-col items-center justify-center gap-3 rounded-xl3 border-2 border-dashed px-6 py-12 text-center transition",
            dragOver
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
              : "border-ink-200 bg-white/60 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-800/40",
          ].join(" ")}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-brand">
            <UploadCloud size={24} />
          </div>
          <p className="text-lg font-black text-ink-900 dark:text-ink-50">Drop your CSV here</p>
          <p className="max-w-md text-sm text-ink-500 dark:text-ink-400">
            We try to detect Date, Merchant and Amount automatically. Most bank exports work
            out-of-the-box (Chase, Amex, Apple Card, Wise, …).
          </p>
          <div className="flex items-center gap-2">
            <Button onClick={() => inputRef.current?.click()} icon={FileSpreadsheet}>
              Choose file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
        </div>
      </Card>

      {stage.status === "preview" ? (
        <Card>
          <SectionHeader
            eyebrow={parsed.fileName}
            title={`${parsed.rows.length} rows ready to import`}
            action={
              <div className="flex items-center gap-2">
                <Button variant="ghost" icon={Trash2} onClick={reset}>
                  Discard
                </Button>
                <Button onClick={commit} icon={Wand2}>
                  {mode === "replace" ? "Replace store" : "Append to store"}
                </Button>
              </div>
            }
          />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Pill tone="soft">
              <CategoryDot category="Other" size={8} />
              Detected columns: {parsed.mapping?.date} · {parsed.mapping?.merchant} ·{" "}
              {parsed.mapping?.amount}
            </Pill>
            <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-1 py-1 dark:border-ink-700 dark:bg-ink-800">
              {[
                { id: "append", label: "Append" },
                { id: "replace", label: "Replace" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    mode === m.id ? "bg-brand text-white shadow-brand" : "text-ink-600 dark:text-ink-300",
                  ].join(" ")}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl2 border border-ink-100 dark:border-ink-800">
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b border-ink-100 bg-[#f8fbff] px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-500 md:grid dark:border-ink-800 dark:bg-ink-800/60 dark:text-ink-400">
              <span>Merchant</span>
              <span>Date</span>
              <span>Category</span>
              <span className="text-right">Amount</span>
            </div>
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {parsed.rows.slice(0, 25).map((r, i) => (
                <li
                  key={`${r.date}-${i}`}
                  className="grid grid-cols-[1.4fr_1fr_auto] gap-3 px-4 py-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink-900 dark:text-ink-50">{r.merchant_normalized}</p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">{r.merchant_raw}</p>
                  </div>
                  <p className="self-center text-sm text-ink-600 dark:text-ink-300">{formatDate(r.date)}</p>
                  <div className="hidden self-center md:flex">
                    <Badge tone="neutral">
                      <CategoryDot category={r.category} size={8} />
                      {r.category}
                    </Badge>
                  </div>
                  <p className="tabular self-center text-right font-black text-ink-900 dark:text-ink-50">
                    -{formatAmountSpend(r.amount)}
                  </p>
                </li>
              ))}
            </ul>
            {parsed.rows.length > 25 ? (
              <p className="border-t border-ink-100 bg-white px-4 py-3 text-xs text-ink-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400">
                Previewing first 25 rows · {parsed.rows.length - 25} more will be imported.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {stage.status === "done" ? (
        <Card>
          <EmptyState
            icon={Wand2}
            title={
              stage.demo
                ? `Reset to ${stage.count} demo transactions`
                : `${stage.count} rows imported`
            }
            description="Head to Overview, Transactions or Insights to see them analyzed."
            action={<Button onClick={reset}>Import more</Button>}
          />
        </Card>
      ) : null}

      {stage.status === "error" ? (
        <Card>
          <EmptyState icon={Trash2} title="Couldn't read that CSV" description={stage.message} />
        </Card>
      ) : null}
    </section>
  );
}

export default UploadPage;
