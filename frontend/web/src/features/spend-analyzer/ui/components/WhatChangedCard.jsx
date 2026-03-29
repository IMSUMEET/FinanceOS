export default function WhatChangedCard({ title = "What changed", items }) {
  if (!items?.length) return null;

  return (
    <section className="whatChanged">
      <h2 className="sectionEyebrow">{title}</h2>
      <div className="whatChangedList">
        {items.map((it, i) => (
          <button
            key={it.key ?? i}
            type="button"
            className={`whatChangedRow tone-${it.tone ?? "indigo"} ${it.onClick ? "whatChangedRowInteractive" : ""}`}
            onClick={it.onClick}
          >
            <div className="whatChangedRowText">{it.text}</div>
            <div className="whatChangedRight">
              {it.delta ? <div className="whatChangedDelta">{it.delta}</div> : null}
              {it.onClick ? <div className="whatChangedExplore">Click to explore</div> : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

