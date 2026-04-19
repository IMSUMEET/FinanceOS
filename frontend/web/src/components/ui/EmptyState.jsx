import { createElement } from "react";

function EmptyState({ icon, title, description, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl2 border border-dashed border-ink-200 bg-white/60 px-6 py-10 text-center dark:border-ink-700 dark:bg-ink-900/40 ${className}`}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
          {createElement(icon, { size: 22 })}
        </div>
      ) : null}
      <h4 className="text-base font-bold text-ink-900 dark:text-ink-50">{title}</h4>
      {description ? (
        <p className="max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export default EmptyState;
