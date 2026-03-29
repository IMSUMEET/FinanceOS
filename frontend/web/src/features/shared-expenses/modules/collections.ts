import { readCollection } from "../../../shared/lib/localDB";
import { STORAGE_KEYS } from "../../../shared/lib/storageKeys";
import {
  mockExpenses,
  mockGroups,
  mockParticipants,
  mockSettlements,
} from "../data/mock";
import type { Expense, Group, Participant, Settlement } from "../types";

export function getParticipantsCollection() {
  return readCollection<Participant>(
    STORAGE_KEYS.participants,
    mockParticipants,
  );
}

export function getGroupsCollection() {
  return readCollection<Group>(STORAGE_KEYS.groups, mockGroups);
}

export function getExpensesCollection() {
  return readCollection<Expense>(STORAGE_KEYS.expenses, mockExpenses);
}

export function getSettlementsCollection() {
  return readCollection<Settlement>(
    STORAGE_KEYS.settlements,
    mockSettlements,
  );
}
