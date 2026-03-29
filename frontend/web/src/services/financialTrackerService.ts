import {
  mockImportedFiles,
  mockTransactions,
} from "../data/mock/financial-tracker";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getImportedFiles() {
  await wait(250);
  return mockImportedFiles;
}

export async function getTransactions() {
  await wait(300);
  return mockTransactions;
}
