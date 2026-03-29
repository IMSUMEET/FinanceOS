export default function AnalysisEmptyState() {
  return (
    <div className="analysisEmpty">
      <p className="analysisEmptyTitle">Import data to open the analysis console</p>
      <p className="analysisEmptyBody">
        Charts, trends, merchant intelligence, and the slide-over drill panel activate once transactions are in the database. Use{" "}
        <strong>Import</strong> above, or confirm your API is reachable if you expected existing data.
      </p>
      <div className="heroRow heroRowSkeleton" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="summaryCardSkeleton" />
        ))}
      </div>
    </div>
  );
}
