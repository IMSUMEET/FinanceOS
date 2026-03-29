import { generateId, writeCollection } from "../../../shared/lib/localDB";
import { STORAGE_KEYS } from "../../../shared/lib/storageKeys";
import { getGroupsCollection } from "../modules/collections";
import type { Group } from "../types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
