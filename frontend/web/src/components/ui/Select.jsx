import { ChevronDown } from "lucide-react";
import { createElement } from "react";

function Select({ value, onChange, options, className = "", leadingIcon, ...rest }) {
  function handleChange(e) {
    onChange?.(e);
    e.currentTarget.blur();
  }

  const hasLeading = Boolean(leadingIcon);
  const padLeft = hasLeading ? "pl-10" : "pl-4";

  return (
    <div
      className={`relative inline-flex items-center rounded-full transition focus-within:ring-2 focus-within:ring-brand-400/20 clay-input-light ${className}`}
    >
      {hasLeading ? (
        <span className="pointer-events-none absolute left-3 flex items-center text-ink-400 dark:text-ink-300">
          {createElement(leadingIcon, { size: 14 })}
        </span>
      ) : null}
      <select
        value={value}
        onChange={handleChange}
        className={`h-11 w-full cursor-pointer appearance-none bg-transparent ${padLeft} pr-9 text-sm font-semibold text-ink-800 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white rounded-full dark:text-ink-100 dark:focus-visible:ring-offset-ink-900`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 text-ink-400 dark:text-ink-300"
      />
    </div>
  );
}

export default Select;
