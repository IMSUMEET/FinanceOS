import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney, formatMonthLabel } from "../utils/format.js";
import { lastDayOfMonth } from "../utils/periods.js";
import { CHART_MUTED } from "../constants/chartTheme.js";

function groupByCategory(transactions) {
  const m = new Map();
  for (const t of transactions) {
    const cat = t.category || "Other";
    m.set(cat, (m.get(cat) || 0) + (Number(t.amount) || 0));
  }
  return [...m.entries()]
    .map(([name, total]) => ({ name, value: Math.abs(total) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function groupByMerchant(transactions) {
  const m = new Map();
  for (const t of transactions) {
    const mer = t.merchant_normalized || t.merchant_raw || "Unknown";
    m.set(mer, (m.get(mer) || 0) + (Number(t.amount) || 0));
  }
  return [...m.entries()]
    .map(([name, total]) => ({ name, value: Math.abs(total) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export default function DrillDownPanel({ open, context, onClose, apiBase }) {
  const [loading, setLoading] = useState(false);
  const [txns, setTxns] = useState([]);

  const load = useCallback(async () => {
    if (!context) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (context.dateFrom) params.set("date_from", context.dateFrom);
    if (context.dateTo) params.set("date_to", context.dateTo);
    if (context.type === "category") params.set("category", context.value);
    if (context.type === "merchant") params.set("merchant", context.value);
    if (context.type === "month") {
      const ym = context.value;
      params.set("date_from", `${ym}-01`);
      params.set("date_to", lastDayOfMonth(ym));
    }
    try {
      const r = await fetch(`${apiBase}/transactions?${params}`);
      const data = await r.json();
      setTxns(Array.isArray(data) ? data : []);
    } catch {
      setTxns([]);
    } finally {
      setLoading(false);
    }
  }, [context, apiBase]);

  useEffect(() => {
    if (!open || !context) return;
    load();
  }, [open, context, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !context) return null;

  const total = txns.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const absTotal = Math.abs(total);
  const count = txns.length;
  const sorted = [...txns].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const lastTxn = sorted.length ? sorted[sorted.length - 1] : null;

  const title =
    context.type === "category"
      ? `Category · ${context.value}`
      : context.type === "merchant"
        ? `Merchant · ${context.value}`
        : `Month · ${formatMonthLabel(context.value)}`;

  const miniData =
    context.type === "category"
      ? groupByMerchant(txns)
      : context.type === "merchant"
        ? groupByCategory(txns)
        : groupByCategory(txns);

  const insightLines = [];
  if (context.type === "category" && miniData[0]) {
    insightLines.push(`Most of this category went to ${miniData[0].name}.`);
  }
  if (context.type === "merchant" && count > 3) {
    insightLines.push(`You visited this merchant ${count} times in this window — small charges add up.`);
  }
  if (context.type === "month" && miniData[0]) {
    insightLines.push(`${miniData[0].name} was the top category this month.`);
  }
  if (absTotal > 0 && count === 1) {
    insightLines.push(`Single transaction drove the full amount here.`);
  }

  return (
    <>
      <button type="button" className="drillBackdrop" aria-label="Close panel" onClick={onClose} />
      <aside className="drillPanel" role="dialog" aria-modal="true" aria-labelledby="drill-panel-title">
        <div className="drillPanelHeader">
          <h2 id="drill-panel-title" className="drillPanelTitle">
            {title}
          </h2>
          <button type="button" className="drillClose" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="drillPanelBody">
          {loading ? (
            <p className="drillMuted">Loading…</p>
          ) : (
            <div className="drillPanelContent">
              <div className="drillKpis">
                <div>
                  <span className="drillKpiLabel">Total</span>
                  <span className="drillKpiValue">{formatMoney(total)}</span>
                </div>
                <div>
                  <span className="drillKpiLabel">Transactions</span>
                  <span className="drillKpiValue">{count}</span>
                </div>
                {context.type === "merchant" && lastTxn && (
                  <div>
                    <span className="drillKpiLabel">Latest</span>
                    <span className="drillKpiValue sm">{lastTxn.date}</span>
                  </div>
                )}
              </div>

              {miniData.length > 0 && (
                <div className="drillMiniChart">
                  <h3 className="drillSectionTitle">
                    {context.type === "merchant" ? "Categories" : "Top counterparties"}
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={miniData} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => formatMoney(v)} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                      <Bar dataKey="value" fill={CHART_MUTED.bar} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {insightLines.length > 0 && (
                <div className="drillInsights">
                  {insightLines.slice(0, 2).map((line, i) => (
                    <p key={i} className="drillInsightLine">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              <div className="drillTableWrap">
                <h3 className="drillSectionTitle">Transactions</h3>
                {txns.length === 0 ? (
                  <p className="drillMuted">No rows in this range.</p>
                ) : (
                  <table className="drillTable">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Merchant</th>
                        <th>Category</th>
                        <th className="drillNum">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txns.slice(0, 80).map((t) => (
                        <tr key={t.id}>
                          <td>{t.date || "—"}</td>
                          <td>{t.merchant_normalized || t.merchant_raw || "—"}</td>
                          <td>{t.category || "—"}</td>
                          <td className="drillNum">{formatMoney(t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {txns.length > 80 && <p className="drillMuted">Showing 80 of {txns.length}.</p>}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
