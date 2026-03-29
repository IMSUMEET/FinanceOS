export type ImportedFile = {
  id: string;
  fileName: string;
  status: "uploaded" | "parsed" | "ready";
  rowCount: number;
};

export type TransactionRecord = {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
};
