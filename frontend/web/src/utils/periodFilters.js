import {
  FLOW_PERIOD_ALL,
  FLOW_PERIOD_LAST_12,
  FLOW_PERIOD_THIS_YEAR,
  availableYears as availableYearsShared,
  filterByPeriod,
  buildPeriodOptions,
} from "@oblivion-labs/arsenal-shared";

export { FLOW_PERIOD_ALL, FLOW_PERIOD_LAST_12, FLOW_PERIOD_THIS_YEAR };

const getDate = (transaction) => transaction.date;

export function availableYears(transactions) {
  return availableYearsShared(transactions, getDate);
}

export function filterTransactionsByPeriod(transactions, period) {
  return filterByPeriod(transactions, period, getDate);
}

export function flowPeriodOptions(transactions) {
  return buildPeriodOptions(transactions, getDate);
}
