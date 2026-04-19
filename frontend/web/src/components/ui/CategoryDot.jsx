import { categoryColor } from "../../utils/categories";

function CategoryDot({ category, size = 12, className = "" }) {
  const color = categoryColor(category);
  return (
    <span
      className={`inline-block rounded-full ${className}`}
      style={{ background: color, width: size, height: size }}
      aria-hidden
    />
  );
}

export default CategoryDot;
