import { useLocation } from "react-router-dom";
import { useTransactions } from "./useTransactions";
import { pathnameToPageKey } from "./pageFilters";

export function usePageFilters(explicitPageKey) {
  const { pathname } = useLocation();
  const pageKey = explicitPageKey ?? pathnameToPageKey(pathname);
  const { pageFilters, setPageFilters, filteredByPage, derivedByPage } = useTransactions();

  return {
    pageKey,
    filters: pageFilters[pageKey],
    setFilters: (updater) => setPageFilters(pageKey, updater),
    filtered: filteredByPage[pageKey],
    derived: derivedByPage[pageKey],
  };
}
