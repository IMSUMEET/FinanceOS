import { useState, useCallback, useEffect, useMemo } from "react";
import "./App.css";
import "./styles/dashboard.css";
import SummaryCard from "./components/SummaryCard.jsx";
import DonutChartCard from "./components/DonutChartCard.jsx";
import TrendChartCard from "./components/TrendChartCard.jsx";
import MerchantList from "./components/MerchantList.jsx";
import InsightCards from "./components/InsightCards.jsx";
import AnalysisEmptyState from "./components/AnalysisEmptyState.jsx";
import DrillDownPanel from "./components/DrillDownPanel.jsx";
import PersonalityBadge from "./components/PersonalityBadge.jsx";
import { formatMoney, formatMonthLabel, formatPercentChange, formatSignedPercent } from "./utils/format.js";
import { computeComparisonWindow, lastDayOfMonth, getLastMonthKey } from "./utils/periods.js";
import { topEntryByTotal } from "./utils/insights.js";
import WhatChangedCard from "./components/WhatChangedCard.jsx";
import SuggestionCard from "./components/SuggestionCard.jsx";
import {
  classifySpendingPersonality,
  buildBehavioralInsights,
  buildPredictionInsight,
  buildActionSuggestion,
  buildWhatChangedItems,
} from "./utils/premiumNarrative.js";
import { spendAnalyzerApiBase } from "../services/apiConfig";

const API_BASE = spendAnalyzerApiBase;

function sumCategoryTotal(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((s, c) => s + Math.abs(Number(c.total) || 0), 0);
}

export default function App() {
  const [source, setSource] = useState("chase");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [merchantBreakdown, setMerchantBreakdown] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [prevCategoryBreakdown, setPrevCategoryBreakdown] = useState([]);
  const [prevMerchantBreakdown, setPrevMerchantBreakdown] = useState([]);
  const [heroMonthSnapshot, setHeroMonthSnapshot] = useState(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [merchantFilter, setMerchantFilter] = useState("");

  const [drillPanel, setDrillPanel] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (categoryFilter) params.set("category", categoryFilter);
      if (merchantFilter) params.set("merchant", merchantFilter);
      const r = await fetch(`${API_BASE}/transactions?${params}`);
      const data = await r.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [dateFrom, dateTo, categoryFilter, merchantFilter]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const [catRes, merRes, monRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/category-breakdown?${params}`),
        fetch(`${API_BASE}/analytics/merchant-breakdown?${params}`),
        fetch(`${API_BASE}/analytics/monthly?${params}`),
      ]);
      const catData = await catRes.json();
      const merData = await merRes.json();
      const monData = await monRes.json();
      setCategoryBreakdown(Array.isArray(catData) ? catData : []);
      setMerchantBreakdown(Array.isArray(merData) ? merData : []);
      setMonthlyData(Array.isArray(monData) ? monData : []);
    } catch {
      setCategoryBreakdown([]);
      setMerchantBreakdown([]);
      setMonthlyData([]);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    const win = computeComparisonWindow(dateFrom, dateTo, monthlyData);
    if (!win?.previous?.date_from || !win?.previous?.date_to) {
      setPrevCategoryBreakdown([]);
      setPrevMerchantBreakdown([]);
      return;
    }
    let cancelled = false;
    const p = new URLSearchParams();
    p.set("date_from", win.previous.date_from);
    p.set("date_to", win.previous.date_to);
    Promise.all([
      fetch(`${API_BASE}/analytics/category-breakdown?${p}`).then((r) => r.json()),
      fetch(`${API_BASE}/analytics/merchant-breakdown?${p}`).then((r) => r.json()),
    ])
      .then(([cats, mers]) => {
        if (cancelled) return;
        setPrevCategoryBreakdown(Array.isArray(cats) ? cats : []);
        setPrevMerchantBreakdown(Array.isArray(mers) ? mers : []);
      })
      .catch(() => {
        if (!cancelled) {
          setPrevCategoryBreakdown([]);
          setPrevMerchantBreakdown([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo, monthlyData]);

  useEffect(() => {
    if (dateFrom || dateTo) {
      setHeroMonthSnapshot(null);
      return;
    }
    const last = getLastMonthKey(monthlyData);
    if (!last) {
      setHeroMonthSnapshot(null);
      return;
    }
    let cancelled = false;
    const from = `${last}-01`;
    const to = lastDayOfMonth(last);
    Promise.all([
      fetch(`${API_BASE}/analytics/category-breakdown?date_from=${from}&date_to=${to}`).then((r) => r.json()),
      fetch(`${API_BASE}/analytics/merchant-breakdown?date_from=${from}&date_to=${to}`).then((r) => r.json()),
    ])
      .then(([cats, mers]) => {
        if (cancelled) return;
        setHeroMonthSnapshot({
          monthKey: last,
          cats: Array.isArray(cats) ? cats : [],
          mers: Array.isArray(mers) ? mers : [],
        });
      })
      .catch(() => {
        if (!cancelled) setHeroMonthSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [monthlyData, dateFrom, dateTo]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith(".csv") || f.type === "text/csv")) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const onFileChange = useCallback((e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (!f) setResult(null);
  }, []);

  async function upload() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setShowRaw(false);
    const form = new FormData();
    form.append("source", source);
    form.append("file", file);
    try {
      const r = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
      const data = await r.json();
      setResult(data);
      if (!data.error) {
        fetchTransactions();
        fetchAnalytics();
      }
    } catch (e) {
      setResult({ error: "Upload failed. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  }

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCategoryFilter("");
    setMerchantFilter("");
    setDrillPanel(null);
  };

  const openDrill = (type, value) => {
    setDrillPanel({ type, value });
  };

  const isError = result && "error" in result;
  const categoriesForPie = Array.isArray(categoryBreakdown)
    ? categoryBreakdown.map((c) => ({ name: c.category, value: Math.abs(Number(c.total) || 0) }))
    : [];

  const comparisonMode = prevCategoryBreakdown.length > 0;

  const personality = useMemo(
    () => classifySpendingPersonality({ categoryBreakdown, transactions }),
    [categoryBreakdown, transactions],
  );

  const behavioralInsights = useMemo(() => {
    if (transactionsLoading) return [];
    return buildBehavioralInsights(transactions);
  }, [transactionsLoading, transactions]);

  const prediction = useMemo(() => buildPredictionInsight({ monthlyData }), [monthlyData]);

  const suggestion = useMemo(
    () => buildActionSuggestion({ transactions, categoryBreakdown, prevCategoryBreakdown }),
    [transactions, categoryBreakdown, prevCategoryBreakdown],
  );

  const extraInsight = useMemo(() => {
    const cats = Array.isArray(categoryBreakdown) ? categoryBreakdown : [];
    if (!cats.length) return null;

    const byTotal = [...cats].sort((a, b) => Math.abs(Number(b.total) || 0) - Math.abs(Number(a.total) || 0))[0];
    const byCount = [...cats].sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))[0];

    if (byTotal?.category && byCount?.category && byTotal.category !== byCount.category) {
      return {
        key: "frequency-leads",
        tone: "indigo",
        icon: "⌁",
        text: `Small purchases quietly beat your big ones this month — ${byCount.category} showed up most.`,
        hint: "Frequency is often the real driver.",
      };
    }

    const grocery = cats.find((c) => {
      const t = String(c.category || "").toLowerCase();
      return t.includes("groc") || t.includes("market") || t.includes("supermarket");
    });
    const totalAmt = cats.reduce((s, c) => s + Math.abs(Number(c.total) || 0), 0);
    const totalCount = cats.reduce((s, c) => s + (Number(c.count) || 0), 0);
    const overallAvg = totalCount > 0 ? totalAmt / totalCount : 0;

    if (grocery && grocery.count > 0 && overallAvg > 0) {
      const groceryAvg = Math.abs(Number(grocery.total) || 0) / Math.max(1, Number(grocery.count) || 0);
      if (groceryAvg < overallAvg * 0.8) {
        return {
          key: "repeat-grocery",
          tone: "indigo",
          icon: "↻",
          text: "Most of your grocery spend came from repeat trips, not bulk buys.",
          hint: "Try fewer, more intentional runs.",
        };
      }
    }

    return null;
  }, [categoryBreakdown]);

  const insights = useMemo(() => {
    const arr = [];
    if (behavioralInsights?.length) arr.push(...behavioralInsights);
    if (prediction) arr.push(prediction);
    if (extraInsight) arr.push(extraInsight);
    return arr.filter((x) => x?.text).slice(0, 4);
  }, [behavioralInsights, prediction, extraInsight]);

  const whatChangedItems = useMemo(
    () =>
      buildWhatChangedItems({
        categoryBreakdown,
        prevCategoryBreakdown,
        merchantBreakdown,
        prevMerchantBreakdown,
        dateFrom,
        dateTo,
      }),
    [categoryBreakdown, prevCategoryBreakdown, merchantBreakdown, prevMerchantBreakdown, dateFrom, dateTo],
  );

  const hero = useMemo(() => {
    const filteredRange = Boolean(dateFrom && dateTo);
    const totalAll = sumCategoryTotal(categoryBreakdown);
    const lastMonthKey = getLastMonthKey(monthlyData);
    const monthRows = [...(monthlyData || [])].sort((a, b) => a.month.localeCompare(b.month));

    let totalSpend = totalAll;
    let periodHint = "All recorded activity";

    if (filteredRange) {
      periodHint = "Selected range";
      totalSpend = totalAll;
    } else if (lastMonthKey && heroMonthSnapshot?.monthKey === lastMonthKey) {
      const row = monthRows.find((m) => m.month === lastMonthKey);
      totalSpend = Math.abs(Number(row?.total) || 0);
      periodHint = `Latest · ${formatMonthLabel(lastMonthKey)}`;
    }

    let changePct = null;
    if (filteredRange && comparisonMode) {
      const cur = sumCategoryTotal(categoryBreakdown);
      const prev = sumCategoryTotal(prevCategoryBreakdown);
      changePct = formatPercentChange(cur, prev);
    } else if (monthRows.length >= 2) {
      const b = monthRows[monthRows.length - 1];
      const a = monthRows[monthRows.length - 2];
      changePct = formatPercentChange(Math.abs(Number(b.total) || 0), Math.abs(Number(a.total) || 0));
    }

    let topCat = topEntryByTotal(categoryBreakdown, "category");
    let topMer = topEntryByTotal(merchantBreakdown, "merchant");
    if (!filteredRange && heroMonthSnapshot?.cats?.length) {
      topCat = topEntryByTotal(heroMonthSnapshot.cats, "category");
      topMer = topEntryByTotal(heroMonthSnapshot.mers, "merchant");
    }

    const smartLine = prediction?.shortText || personality?.message || "Explore your biggest drivers in one click.";

    return {
      totalSpend,
      periodHint,
      changePct,
      topCat,
      topMer,
      smartLine,
    };
  }, [
    categoryBreakdown,
    merchantBreakdown,
    monthlyData,
    dateFrom,
    dateTo,
    prevCategoryBreakdown,
    comparisonMode,
    heroMonthSnapshot,
    prediction,
    personality,
  ]);

  const prevMerMap = useMemo(() => {
    const m = new Map();
    for (const r of prevMerchantBreakdown) {
      m.set(r.merchant, r.total);
    }
    return m;
  }, [prevMerchantBreakdown]);

  const drillContext = useMemo(() => {
    if (!drillPanel) return null;
    return {
      type: drillPanel.type,
      value: drillPanel.value,
      dateFrom,
      dateTo,
    };
  }, [drillPanel, dateFrom, dateTo]);

  const hasAnalyticsData =
    categoriesForPie.length > 0 ||
    (Array.isArray(monthlyData) && monthlyData.length > 0) ||
    (Array.isArray(merchantBreakdown) && merchantBreakdown.length > 0);

  return (
    <div className="app">
      <header className="consoleHeader">
        <h1 className="consoleTitle">Spend intelligence</h1>
        <p className="consoleSubtitle">
          Understand where money goes, what moved, and where to focus — without leaving this screen.
        </p>
      </header>

      <section className="card uploadSection">
        <h2 className="cardTitle">Import</h2>
        <div className="formRow">
          <div>
            <label className="label" htmlFor="source">
              Source
            </label>
            <select id="source" className="select" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="chase">Chase</option>
              <option value="amex">Amex</option>
              <option value="apple_card">Apple Card</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="label">CSV file</label>
            <div
              className={`dropZone ${dragOver ? "dragOver" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <div className="dropZoneIcon">📄</div>
              <p className="dropZoneText">{file ? "Replace file" : "Drop CSV here or browse"}</p>
              <p className="dropZoneHint">date, description or merchant, amount</p>
              {file && <p className="dropZoneFile">{file.name}</p>}
            </div>
            <input id="file-input" type="file" className="fileInput" accept=".csv,text/csv" onChange={onFileChange} />
          </div>
          <div className="actions">
            <button type="button" className="btn btnPrimary" onClick={upload} disabled={!file || loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Uploading…
                </>
              ) : (
                "Upload"
              )}
            </button>
            {file && !loading && (
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  document.getElementById("file-input").value = "";
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {result && (
        <section className={`resultCard ${isError ? "error" : "success"}`}>
          <h2 className="resultTitle">{isError ? "Error" : "Upload complete"}</h2>
          {isError ? (
            <p className="resultError">{result.error}</p>
          ) : (
            <>
              <div className="resultSummary">
                <div className="resultStat">
                  <span className="resultStatValue">{result.inserted ?? 0}</span>
                  <span className="resultStatLabel">imported</span>
                </div>
                <div className="resultStat">
                  <span className="resultStatValue">{result.skipped ?? 0}</span>
                  <span className="resultStatLabel">skipped</span>
                </div>
              </div>
              <p className="resultMeta">
                {result.source && `Source: ${result.source}`}
                {result.filename && ` · ${result.filename}`}
              </p>
            </>
          )}
          <button type="button" className="rawToggle" onClick={() => setShowRaw((s) => !s)}>
            {showRaw ? "Hide" : "Show"} raw response
          </button>
          {showRaw && <pre className="rawPre">{JSON.stringify(result, null, 2)}</pre>}
        </section>
      )}

      <section className="card dashboardSection">
        <div className="dashboardToolbar">
          <h2 className="cardTitle" style={{ margin: 0 }}>
            Analysis
          </h2>
          <div className="filterRow">
            <label>
              From{" "}
              <input type="date" className="inputSm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label>
              To{" "}
              <input type="date" className="inputSm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
            <button type="button" className="btn btnSecondary btnSm" onClick={clearFilters}>
              Reset range
            </button>
          </div>
        </div>

        {analyticsLoading ? (
          <p className="tableEmpty">Loading analytics…</p>
        ) : !hasAnalyticsData ? (
          <AnalysisEmptyState />
        ) : (
          <>
            <div className="heroRow">
                <SummaryCard
                  label="Total spend"
                  value={formatMoney(hero.totalSpend)}
                  hint={hero.periodHint}
                />
                <SummaryCard
                  label="Change vs prior"
                  value={hero.changePct == null ? "—" : formatSignedPercent(hero.changePct)}
                  hint={dateFrom && dateTo ? "Prior window" : "Last month vs previous"}
                  valueClassName={
                    hero.changePct == null ? "" : hero.changePct > 0 ? "isAmber" : "isEmerald"
                  }
                />
                <SummaryCard
                  label="Top category"
                  value={hero.topCat?.name ?? "—"}
                  hint={hero.topCat ? formatMoney(hero.topCat.value) : null}
                />
                <SummaryCard
                  label="Top merchant"
                  value={hero.topMer?.name ?? "—"}
                  hint={hero.topMer ? formatMoney(hero.topMer.value) : null}
                />
                <SummaryCard
                  label="Smart insight"
                  variant="prose"
                  value={hero.smartLine}
                  badge={<PersonalityBadge label={personality?.label} tone={personality?.tone} />}
                />
              </div>

              <div
                className={
                  categoriesForPie.length > 0 && Array.isArray(monthlyData) && monthlyData.length > 0
                    ? "analysisGrid"
                    : "analysisGrid analysisGridSingle"
                }
                style={{ marginTop: 22 }}
              >
                {categoriesForPie.length > 0 && (
                  <DonutChartCard
                    title="Categories"
                    data={categoriesForPie}
                    onSegmentClick={(name) => openDrill("category", name)}
                  />
                )}
                {Array.isArray(monthlyData) && monthlyData.length > 0 && (
                  <TrendChartCard
                    title="Monthly trend"
                    monthlyData={monthlyData}
                    onBarClick={(month) => openDrill("month", month)}
                  />
                )}
              </div>

              {Array.isArray(whatChangedItems) && whatChangedItems.length > 0 && (
                <WhatChangedCard
                  title="What changed"
                  items={whatChangedItems.map((it) => ({
                    key: it.key,
                    tone: it.tone,
                    delta: it.delta,
                    text: it.text,
                    onClick: () => {
                      if (!it.drill) return;
                      openDrill(it.drill.type, it.drill.value);
                    },
                  }))}
                />
              )}

              {Array.isArray(merchantBreakdown) && merchantBreakdown.length > 0 && (
                <MerchantList
                  title="Merchant intelligence"
                  merchants={merchantBreakdown}
                  prevByName={prevMerMap}
                  onRowClick={(name) => openDrill("merchant", name)}
                />
              )}

              <InsightCards
                title="Insights"
                insights={insights.map((it) => {
                  if (it?.onClick) return it;
                  if (!hero?.topCat?.name) return it;
                  return { ...it, onClick: () => openDrill("category", hero.topCat.name) };
                })}
              />

              {suggestion && (
                <SuggestionCard
                  suggestion={suggestion}
                  onApply={() => {
                    if (suggestion.key === "suggest-delivery" && hero.topMer?.name) openDrill("merchant", hero.topMer.name);
                    else if (hero.topCat?.name) openDrill("category", hero.topCat.name);
                  }}
                />
              )}
          </>
        )}
      </section>

      <section className="card">
        <div className="tableHeader">
          <h2 className="cardTitle">Transactions</h2>
          <div className="filterRow">
            <input
              type="date"
              className="inputSm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
            />
            <input
              type="date"
              className="inputSm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To"
            />
            <input
              type="text"
              className="inputSm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Category"
            />
            <input
              type="text"
              className="inputSm"
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              placeholder="Merchant"
            />
            <button type="button" className="btn btnSecondary btnSm" onClick={fetchTransactions} disabled={transactionsLoading}>
              {transactionsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>
        {transactionsLoading ? (
          <p className="tableEmpty">Loading transactions…</p>
        ) : transactions.length === 0 ? (
          <p className="tableEmpty">No transactions. Upload a CSV or adjust filters.</p>
        ) : (
          <div className="tableWrap">
            <table className="transactionsTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="amountCol">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date || "—"}</td>
                    <td>
                      <span className="sourceBadge">{t.merchant_normalized || t.merchant_raw || "—"}</span>
                    </td>
                    <td>{t.category || "—"}</td>
                    <td>{t.description || "—"}</td>
                    <td className={`amountCol ${Number(t.amount) < 0 ? "amountNegative" : "amountPositive"}`}>
                      {typeof t.amount === "number"
                        ? t.amount < 0
                          ? `-$${Math.abs(t.amount).toFixed(2)}`
                          : `$${t.amount.toFixed(2)}`
                        : t.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DrillDownPanel open={Boolean(drillPanel)} context={drillContext} onClose={() => setDrillPanel(null)} apiBase={API_BASE} />
    </div>
  );
}
