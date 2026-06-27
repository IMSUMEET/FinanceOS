import { csvFilename, downloadCsv } from "@oblivion-labs/arsenal-frontend";

const EXPORT_COLUMNS = [
  "id",
  "date",
  "merchant_normalized",
  "merchant_raw",
  "description",
  "amount",
  "currency",
  "category",
  "source",
  "card_identity",
];

export function exportTransactionsCsv(rows) {
  downloadCsv({
    columns: EXPORT_COLUMNS,
    rows,
    filename: csvFilename("financeos-transactions"),
  });
}
