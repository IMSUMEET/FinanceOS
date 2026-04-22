function SectionHeader({ eyebrow, title, action, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">{eyebrow}</p>
        ) : null}
        <h3 className="mt-2 text-2xl font-black text-ink-900 dark:text-ink-50">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export default SectionHeader;
