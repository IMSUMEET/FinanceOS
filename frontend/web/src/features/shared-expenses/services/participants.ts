import { generateId, writeCollection } from "../../../shared/lib/localDB";
import { STORAGE_KEYS } from "../../../shared/lib/storageKeys";
import { getParticipantsCollection } from "../modules/collections";
import type { Participant } from "../types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
