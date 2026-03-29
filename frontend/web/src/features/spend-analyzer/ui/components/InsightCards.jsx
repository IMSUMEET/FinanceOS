import InsightCard from "./InsightCard.jsx";

export default function InsightCards({ title, insights }) {
  if (!insights?.length) return null;

  return (
    <section className="insightSection">
      <h2 className="sectionEyebrow">{title}</h2>
      <div className="insightGrid">
        {insights.map((item, i) => {
          const obj = typeof item === "string" ? { text: item, tone: "indigo" } : item;
          const key = obj.key ?? i;

          return (
            <InsightCard
              key={key}
              icon={obj.icon}
              tone={obj.tone ?? "indigo"}
              text={obj.text ?? ""}
              hint={obj.hint}
              onClick={obj.onClick}
              className="insightCardEnter"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          );
        })}
      </div>
    </section>
  );
}
