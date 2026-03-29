import {
  mockExpenses,
  mockGroups,
  mockParticipants,
  mockSettlements,
} from "../../features/shared-expenses/data/mock";
import { mockSubscriptions } from "../../features/subscriptions/data/mock";
import { mockLoans } from "../../features/loans/data/mock";
import { writeCollection } from "../lib/localDB";
import { STORAGE_KEYS } from "../lib/storageKeys";

/** Dev-only: reset localStorage collections to feature mock data. */
export function resetMockDatabase() {
  writeCollection(STORAGE_KEYS.groups, mockGroups);
  writeCollection(STORAGE_KEYS.expenses, mockExpenses);
  writeCollection(STORAGE_KEYS.settlements, mockSettlements);
  writeCollection(STORAGE_KEYS.participants, mockParticipants);
  writeCollection(STORAGE_KEYS.subscriptions, mockSubscriptions);
  writeCollection(STORAGE_KEYS.loans, mockLoans);
}
