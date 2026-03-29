import { formatMoney } from "../utils/format.js";

export default function MerchantList({ title, merchants, prevByName, onRowClick }) {
  const rows = merchants ?? [];
  const max = Math.max(...rows.map((r) => Math.abs(Number(r.total) || 0)), 1);

  return (
    <div className="analysisCard analysisCardPad merchantIntel">
      <h3 className="analysisCardTitle">{title}</h3>
      <ul className="merchantList">
        {rows.slice(0, 10).map((m) => {
          const raw = Number(m.total) || 0;
          const amt = Math.abs(raw);
          const pct = (amt / max) * 100;
          const prev = prevByName?.get(m.merchant);
          const prevAmt = prev != null ? Math.abs(Number(prev) || 0) : null;
          let deltaLabel = null;
          let deltaClass = "isNeutral";
          if (prevAmt != null && prevAmt > 0) {
            const d = ((amt - prevAmt) / prevAmt) * 100;
            if (Math.abs(d) < 0.5) deltaLabel = "flat vs prior";
            else {
              deltaLabel = `${d > 0 ? "+" : ""}${d.toFixed(0)}% vs prior`;
              deltaClass = d > 0 ? "isUp" : "isDown";
            }
          }

          return (
            <li key={m.merchant} className="merchantRow">
              <button type="button" className="merchantRowBtn" onClick={() => onRowClick?.(m.merchant)}>
                <div className="merchantRowTop">
                  <span className="merchantName">{m.merchant}</span>
                  <span className="merchantAmount">{formatMoney(raw)}</span>
                </div>
                <div className="merchantBarTrack" aria-hidden>
                  <div className="merchantBarFill" style={{ width: `${pct}%` }} />
                </div>
                {deltaLabel && <span className={`merchantDelta ${deltaClass}`}>{deltaLabel}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
