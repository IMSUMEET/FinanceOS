import { mockLoans } from "../data/mock/loans";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getLoans() {
  await wait(250);
  return mockLoans;
}
