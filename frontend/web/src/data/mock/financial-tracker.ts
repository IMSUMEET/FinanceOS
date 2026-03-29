import type {
  ImportedFile,
  TransactionRecord,
} from "../../types/financial-tracker";

export const mockImportedFiles: ImportedFile[] = [
  {
    id: "file1",
    fileName: "bank_statement_jan.csv",
    status: "parsed",
    rowCount: 214,
  },
];

export const mockTransactions: TransactionRecord[] = [
  {
    id: "t1",
    date: "2026-03-01",
    merchant: "Starbucks",
    amount: 8.7,
    category: "Coffee",
  },
  {
    id: "t2",
    date: "2026-03-02",
    merchant: "Netflix",
    amount: 15.49,
    category: "Entertainment",
  },
];
