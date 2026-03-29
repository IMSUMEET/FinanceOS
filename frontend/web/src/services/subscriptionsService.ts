import { mockSubscriptions } from "../data/mock/subscriptions";
import { readCollection, writeCollection, generateId } from "../lib/localDB";
import { STORAGE_KEYS } from "../lib/storageKeys";
import type { Subscription } from "../types/subscriptions";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getCollection() {
  return readCollection<Subscription>(
    STORAGE_KEYS.subscriptions,
    mockSubscriptions,
  );
}

export async function getSubscriptions() {
  await wait(120);
  return getCollection();
}

export async function createSubscription(input: {
  name: string;
  monthlyCost: number;
  renewalDate: string;
  status: "active" | "paused" | "cancelled";
  category?: string;
}) {
  await wait(180);

  const items = getCollection();
  const newItem: Subscription = {
    id: generateId("sub"),
    ...input,
  };

  const next = [newItem, ...items];
  writeCollection(STORAGE_KEYS.subscriptions, next);
  return newItem;
}
