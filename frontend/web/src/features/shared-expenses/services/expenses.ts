import { generateId, writeCollection } from "../../../shared/lib/localDB";
import { STORAGE_KEYS } from "../../../shared/lib/storageKeys";
import { getExpensesCollection } from "../modules/collections";
import type { Expense } from "../types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getExpensesByGroupId(
  groupId: string,
): Promise<Expense[]> {
  await wait(120);
  return getExpensesCollection()
    .filter((expense) => expense.groupId === groupId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUngroupedExpenses(): Promise<Expense[]> {
  await wait(120);
  return getExpensesCollection()
    .filter((expense) => !expense.groupId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createExpense(input: {
  title: string;
  amount: number;
  paidByParticipantId: string;
  participantIds: string[];
  groupId?: string;
  splits: { participantId: string; amount: number }[];
  note?: string;
}): Promise<Expense> {
  await wait(180);

  const expenses = getExpensesCollection();

  const newExpense: Expense = {
    id: generateId("expense"),
    title: input.title.trim(),
    amount: input.amount,
    paidByParticipantId: input.paidByParticipantId,
    participantIds: input.participantIds,
    groupId: input.groupId,
    createdAt: new Date().toISOString(),
    splits: input.splits,
    note: input.note,
  };

  const next = [newExpense, ...expenses];
  writeCollection(STORAGE_KEYS.expenses, next);

  return newExpense;
}
