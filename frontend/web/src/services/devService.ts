import {
  mockExpenses,
  mockGroups,
  mockSettlements,
} from "../data/mock/shared-expenses";
import { mockSubscriptions } from "../data/mock/subscriptions";
import { mockLoans } from "../data/mock/loans";
import {
  mockImportedFiles,
  mockTransactions,
} from "../data/mock/financial-tracker";
import { writeCollection } from "../lib/localDB";
import { STORAGE_KEYS } from "../lib/storageKeys";

export function resetMockDatabase() {
  writeCollection(STORAGE_KEYS.groups, mockGroups);
  writeCollection(STORAGE_KEYS.expenses, mockExpenses);
  writeCollection(STORAGE_KEYS.settlements, mockSettlements);
  writeCollection(STORAGE_KEYS.subscriptions, mockSubscriptions);
  writeCollection(STORAGE_KEYS.loans, mockLoans);
  writeCollection(STORAGE_KEYS.importedFiles, mockImportedFiles);
  writeCollection(STORAGE_KEYS.transactions, mockTransactions);
}
