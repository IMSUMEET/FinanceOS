import { getSettlementsCollection } from "../modules/collections";
import type { Settlement } from "../types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getSettlementsByGroupId(
  groupId: string,
): Promise<Settlement[]> {
  await wait(100);
  return getSettlementsCollection()
    .filter((settlement) => settlement.groupId === groupId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
