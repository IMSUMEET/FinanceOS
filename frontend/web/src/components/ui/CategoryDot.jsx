import CategoryBadge from "./CategoryBadge";

const SIZE_MAP = { 8: "xs", 10: "sm", 12: "md" };

/** @deprecated Use CategoryBadge for colored emoji pills. */
function CategoryDot({ size = "sm", ...props }) {
  const mapped = typeof size === "number" ? (SIZE_MAP[size] ?? "sm") : size;
  return <CategoryBadge {...props} size={mapped} />;
}

export default CategoryDot;
