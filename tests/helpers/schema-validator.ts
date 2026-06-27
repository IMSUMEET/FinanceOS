import Ajv from "ajv";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

let ajvInstance: Ajv | null = null;
let schemaDoc: Record<string, unknown> | null = null;

export function getAjv(): Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({ allErrors: true, strict: false });
    addFormats(ajvInstance);
    schemaDoc = loadSchema();
    const { $schema: _schema, ...doc } = schemaDoc;
    ajvInstance.addSchema(doc, doc.$id as string);
  }
  return ajvInstance;
}

export function loadSchema(): Record<string, unknown> {
  if (schemaDoc) return schemaDoc;
  const schemaPath = path.join(root, "frontend/web/src/types/schema.json");
  schemaDoc = JSON.parse(fs.readFileSync(schemaPath, "utf8")) as Record<string, unknown>;
  return schemaDoc;
}

export function loadExamples(): Record<string, unknown> {
  const examplesPath = path.join(root, "frontend/web/src/types/examples.json");
  return JSON.parse(fs.readFileSync(examplesPath, "utf8")) as Record<string, unknown>;
}

export function validateDef(defName: string, data: unknown): void {
  const schema = loadSchema();
  const ajv = getAjv();
  const schemaId = schema.$id as string;
  const validate = ajv.getSchema(`${schemaId}#/$defs/${defName}`);
  if (!validate) {
    throw new Error(`Could not compile schema def: ${defName}`);
  }
  const ok = validate(data);
  if (!ok) {
    throw new Error(`${defName} validation failed: ${ajv.errorsText(validate.errors)}`);
  }
}

export function readFixture(name: string): string {
  return fs.readFileSync(path.join(root, "tests/fixtures", name), "utf8");
}

export function readJsonFixture<T>(name: string): T {
  return JSON.parse(readFixture(name)) as T;
}

export function readGoldenExpected<T>(name: string): T {
  const goldenPath = path.join(root, "tests/golden/expected", name);
  return JSON.parse(fs.readFileSync(goldenPath, "utf8")) as T;
}

export function writeGoldenExpected(name: string, data: unknown): void {
  const dir = path.join(root, "tests/golden/expected");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), `${JSON.stringify(data, null, 2)}\n`);
}

export function normalizeAnalyzeSnapshot(body: Record<string, unknown>) {
  const transactions = (body.transactions as { merchant: string; category: string }[]) ?? [];
  const reportData = (body.reportData as Record<string, number>) ?? {};
  const insights = (body.insights as Record<string, unknown>) ?? {};
  return {
    status: body.status,
    mode: body.mode,
    transactionCount: transactions.length,
    merchants: transactions.map((t) => t.merchant).sort(),
    categories: [...new Set(transactions.map((t) => t.category))].sort(),
    reportData: {
      totalIncome: reportData.totalIncome,
      totalExpenses: reportData.totalExpenses,
      netCashFlow: reportData.netCashFlow,
      savingsRate: reportData.savingsRate,
    },
    aiStatus: body.aiStatus,
    insightKeys: Object.keys(insights).sort(),
  };
}
