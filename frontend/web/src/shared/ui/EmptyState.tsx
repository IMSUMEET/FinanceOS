import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-theme bg-surface-muted px-6 py-10 text-center">
      {icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-surface text-3xl shadow-soft">
          {icon}
        </div>
      ) : null}

      <h3 className="text-2xl font-black tracking-tight text-primary-theme">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-secondary-theme">
        {description}
      </p>

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
