import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PlaidConnection, PlaidAccount, SafePlaidConnection } from "./plaidTypes.js";

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORAGE_FILE =
  process.env.NODE_ENV === "test" || process.env.VITEST
    ? path.join(DATA_DIR, "plaid_store_test.json")
    : path.join(DATA_DIR, "plaid_store.json");

interface LocalStoreSchema {
  connections: Record<string, PlaidConnection>;
  accounts: Record<string, PlaidAccount[]>; // key: connectionId
  transactions: Record<string, Record<string, unknown>[]>; // key: connectionId
}

// Simple symmetric encryption helper using standard node crypto key derived from process or fallback secret
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(
    process.env.PLAID_SECRET || process.env.PLAID_CLIENT_ID || "financeos_local_secure_key_2026",
  )
  .digest();
const IV_LENGTH = 16;

function encryptToken(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decryptToken(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) return encryptedText; // Fallback if plain text
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return encryptedText;
  }
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStore(): LocalStoreSchema {
  ensureDataDir();
  if (!fs.existsSync(STORAGE_FILE)) {
    return { connections: {}, accounts: {}, transactions: {} };
  }
  try {
    const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
    const data = JSON.parse(raw) as LocalStoreSchema;
    if (!data.transactions) data.transactions = {};
    // Decrypt access tokens after loading
    if (data.connections) {
      for (const id of Object.keys(data.connections)) {
        if (data.connections[id].accessToken) {
          data.connections[id].accessToken = decryptToken(data.connections[id].accessToken);
        }
      }
    }
    return data;
  } catch (err) {
    console.error("[PlaidStore] Failed to load store, initializing fresh store", err);
    return { connections: {}, accounts: {}, transactions: {} };
  }
}

function saveStore(store: LocalStoreSchema): void {
  ensureDataDir();
  // Encrypt access tokens before persisting to disk
  const serializableStore: LocalStoreSchema = JSON.parse(JSON.stringify(store));
  for (const id of Object.keys(serializableStore.connections)) {
    if (serializableStore.connections[id].accessToken) {
      serializableStore.connections[id].accessToken = encryptToken(
        serializableStore.connections[id].accessToken,
      );
    }
  }
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(serializableStore, null, 2), "utf-8");
}

export class PlaidStore {
  static getConnections(): PlaidConnection[] {
    const store = loadStore();
    return Object.values(store.connections);
  }

  static getSafeConnections(): SafePlaidConnection[] {
    const store = loadStore();
    return Object.values(store.connections).map((conn) => {
      const accounts = store.accounts[conn.id] || [];
      return {
        id: conn.id,
        itemId: conn.itemId,
        institutionId: conn.institutionId,
        institutionName: conn.institutionName,
        status: conn.status,
        createdAt: conn.createdAt,
        lastSyncedAt: conn.lastSyncedAt,
        accountCount: accounts.length,
      };
    });
  }

  static getConnectionById(id: string): PlaidConnection | undefined {
    const store = loadStore();
    return store.connections[id];
  }

  static getConnectionByItemId(itemId: string): PlaidConnection | undefined {
    const store = loadStore();
    return Object.values(store.connections).find((c) => c.itemId === itemId);
  }

  static saveConnection(connection: PlaidConnection): void {
    const store = loadStore();
    store.connections[connection.id] = connection;
    saveStore(store);
  }

  static updateCursor(connectionId: string, cursor: string, lastSyncedAt: string): void {
    const store = loadStore();
    if (store.connections[connectionId]) {
      store.connections[connectionId].transactionCursor = cursor;
      store.connections[connectionId].lastSyncedAt = lastSyncedAt;
      saveStore(store);
    }
  }

  static updateStatus(
    connectionId: string,
    status: "connected" | "reconnect_required" | "error",
  ): void {
    const store = loadStore();
    if (store.connections[connectionId]) {
      store.connections[connectionId].status = status;
      saveStore(store);
    }
  }

  static removeConnection(id: string): boolean {
    const store = loadStore();
    if (store.connections[id]) {
      delete store.connections[id];
      delete store.accounts[id];
      delete store.transactions[id];
      saveStore(store);
      return true;
    }
    return false;
  }

  static saveAccounts(connectionId: string, accounts: PlaidAccount[]): void {
    const store = loadStore();
    store.accounts[connectionId] = accounts;
    saveStore(store);
  }

  static getAccounts(connectionId?: string): PlaidAccount[] {
    const store = loadStore();
    if (connectionId) {
      return store.accounts[connectionId] || [];
    }
    return Object.values(store.accounts).flat();
  }

  static saveTransactions(connectionId: string, transactions: Record<string, unknown>[]): void {
    const store = loadStore();
    store.transactions[connectionId] = transactions;
    saveStore(store);
  }

  static appendTransactions(
    connectionId: string,
    added: Record<string, unknown>[],
    modified: Record<string, unknown>[] = [],
    removedIds: string[] = [],
  ): Record<string, unknown>[] {
    const store = loadStore();
    const existing = store.transactions[connectionId] || [];
    const removedSet = new Set(removedIds);
    const modifiedMap = new Map(modified.map((m) => [m.externalTransactionId, m]));

    const filtered = existing
      .filter((t) => !removedSet.has(t.externalTransactionId as string))
      .map((t) =>
        modifiedMap.has(t.externalTransactionId as string)
          ? modifiedMap.get(t.externalTransactionId as string)!
          : t,
      );

    const existingKeys = new Set(filtered.map((t) => t.externalTransactionId as string));
    const newItems = added.filter((a) => !existingKeys.has(a.externalTransactionId as string));

    const updated = [...newItems, ...filtered];
    store.transactions[connectionId] = updated;
    saveStore(store);
    return updated;
  }

  static getTransactions(connectionId?: string): Record<string, unknown>[] {
    const store = loadStore();
    if (connectionId) {
      return store.transactions[connectionId] || [];
    }
    return Object.values(store.transactions).flat();
  }
}
