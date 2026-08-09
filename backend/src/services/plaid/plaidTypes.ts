import { CountryCode, Products } from "plaid";

export interface PlaidConnection {
  id: string; // Connection unique identifier (e.g. conn_xxx)
  itemId: string;
  accessToken: string; // Server-side secret token
  institutionId: string;
  institutionName: string;
  status: "connected" | "reconnect_required" | "error";
  createdAt: string;
  lastSyncedAt: string | null;
  transactionCursor: string | null;
}

export interface PlaidAccount {
  id: string; // FinanceOS normalized account ID (acc_xxx or plaidAccountId)
  plaidAccountId: string;
  connectionId: string;
  institution: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number;
  availableBalance: number | null;
  currency: string;
  source: "plaid";
  updatedAt: string;
}

export interface SafePlaidConnection {
  id: string;
  itemId: string;
  institutionId: string;
  institutionName: string;
  status: "connected" | "reconnect_required" | "error";
  createdAt: string;
  lastSyncedAt: string | null;
  accountCount: number;
}

export interface PlaidSyncResult {
  added: Array<Record<string, unknown>>;
  modified: Array<Record<string, unknown>>;
  removed: Array<{ transaction_id?: string }>;
  nextCursor: string;
  hasMore: boolean;
}

export interface PlaidConfig {
  clientId: string;
  secret: string;
  env: string;
  products: Products[];
  countryCodes: CountryCode[];
  redirectUri?: string;
  webhookUrl?: string;
}
