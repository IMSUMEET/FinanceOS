import { mockLoans } from "../data/mock";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getLoans() {
  await wait(250);
  return mockLoans;
}
