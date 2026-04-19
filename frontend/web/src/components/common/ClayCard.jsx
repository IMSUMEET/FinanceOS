function ClayCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[32px] bg-slate-100 shadow-[0_10px_40px_rgba(15,23,42,0.08)] border border-white/50 ${className}`}
    >
      {children}
    </div>
  );
}

export default ClayCard;
