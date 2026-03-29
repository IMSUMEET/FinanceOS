import {
  mockExpenses,
  mockGroups,
  mockParticipants,
  mockSettlements,
} from "../data/mock/shared-expenses";
import { generateId, readCollection, writeCollection } from "../lib/localDB";
import { STORAGE_KEYS } from "../lib/storageKeys";
import type {
  Expense,
  Group,
  Participant,
  Settlement,
} from "../types/shared-expenses";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getParticipantsCollection() {
  return readCollection<Participant>(
    STORAGE_KEYS.participants,
    mockParticipants,
  );
}

function getGroupsCollection() {
  return readCollection<Group>(STORAGE_KEYS.groups, mockGroups);
}

function getExpensesCollection() {
  return readCollection<Expense>(STORAGE_KEYS.expenses, mockExpenses);
}

function getSettlementsCollection() {
  return readCollection<Settlement>(STORAGE_KEYS.settlements, mockSettlements);
}

export async function getParticipants(): Promise<Participant[]> {
  await wait(100);
  return getParticipantsCollection();
}

export async function createParticipant(input: {
  name: string;
  email?: string;
  isRegisteredUser?: boolean;
}): Promise<Participant> {
  await wait(120);

  const participants = getParticipantsCollection();

  const newParticipant: Participant = {
    id: generateId("participant"),
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    isRegisteredUser: input.isRegisteredUser ?? false,
    inviteStatus: input.isRegisteredUser ? "accepted" : "not_invited",
  };

  const next = [newParticipant, ...participants];
  writeCollection(STORAGE_KEYS.participants, next);

  return newParticipant;
}

export async function getGroups(): Promise<Group[]> {
  await wait(120);
  return getGroupsCollection();
}

export async function getGroupById(
  groupId: string,
): Promise<Group | undefined> {
  await wait(100);
  return getGroupsCollection().find((group) => group.id === groupId);
}

export async function createGroup(input: {
  name: string;
  participantIds: string[];
}): Promise<Group> {
  await wait(160);

  const groups = getGroupsCollection();

  const newGroup: Group = {
    id: generateId("group"),
    name: input.name.trim(),
    participantIds: input.participantIds,
  };

  const next = [newGroup, ...groups];
  writeCollection(STORAGE_KEYS.groups, next);

  return newGroup;
}

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

export async function getSettlementsByGroupId(
  groupId: string,
): Promise<Settlement[]> {
  await wait(100);
  return getSettlementsCollection()
    .filter((settlement) => settlement.groupId === groupId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
