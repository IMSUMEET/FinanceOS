import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-theme">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-2 text-4xl font-black tracking-tight text-primary-theme">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-2xl text-base text-secondary-theme">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
