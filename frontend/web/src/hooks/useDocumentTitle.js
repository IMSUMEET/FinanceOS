import { useEffect } from "react";

const DEFAULT_SUFFIX = "FinanceOS";

export function useDocumentTitle(title) {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const previous = document.title;
    document.title = title ? `${title} · ${DEFAULT_SUFFIX}` : DEFAULT_SUFFIX;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export default useDocumentTitle;
