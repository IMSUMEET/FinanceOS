import { categoryDisplayLabel, categoryEmoji, categoryPillStyle } from "../../utils/categories";

const SIZE_CLASS = {
  xs: "gap-1 px-1.5 py-0.5 text-[10px]",
  sm: "gap-1.5 px-2.5 py-1 text-xs",
  md: "gap-2 px-3 py-1.5 text-sm",
};

function CategoryBadge({ category, size = "sm", className = "", as: Tag = "span" }) {
  const pill = categoryPillStyle(category);

  return (
    <Tag
      className={[
        "inline-flex max-w-full min-w-0 items-center rounded-full border font-bold uppercase tracking-wide",
        pill.bg,
        pill.text,
        pill.border,
        SIZE_CLASS[size] ?? SIZE_CLASS.sm,
        className,
      ].join(" ")}
    >
      <span className="shrink-0 leading-none" aria-hidden>
        {categoryEmoji(category)}
      </span>
      <span className="truncate" title={category}>
        {categoryDisplayLabel(category)}
      </span>
    </Tag>
  );
}

export default CategoryBadge;
