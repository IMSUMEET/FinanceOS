import { createElement, forwardRef } from "react";

const Input = forwardRef(function Input(
  { icon, className = "", wrapperClassName = "", ...rest },
  ref,
) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 transition focus-within:shadow-ring clay-input-light ${wrapperClassName}`}
    >
      {icon ? (
        <span className="text-ink-400 dark:text-ink-300">{createElement(icon, { size: 16 })}</span>
      ) : null}
      <input
        ref={ref}
        className={`h-11 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-ink-100 dark:placeholder:text-ink-500 ${className}`}
        {...rest}
      />
    </div>
  );
});

export default Input;
