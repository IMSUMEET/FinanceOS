import {
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  AccountsGetRequest,
  TransactionsSyncRequest,
  ItemRemoveRequest,
} from "plaid";
import { createPlaidClient, getPlaidConfig } from "./plaidClient.js";
import { PlaidStore } from "./plaidStore.js";
import {
  PlaidConnection,
  PlaidAccount,
  SafePlaidConnection,
  PlaidSyncResult,
} from "./plaidTypes.js";

const PRIMARY_USER_ID = "financeos-primary-user";

export class PlaidService {
  /**
   * Create a Plaid Link Token (Initial setup or update mode)
   */
  static async createLinkToken(
    existingConnectionId?: string,
  ): Promise<{ linkToken: string; expiration: string }> {
    const config = getPlaidConfig();
    const plaidClient = createPlaidClient();

    let accessToken: string | undefined = undefined;
    if (existingConnectionId) {
      const conn = PlaidStore.getConnectionById(existingConnectionId);
      if (conn) {
        accessToken = conn.accessToken;
      }
    }

    const request: LinkTokenCreateRequest = {
      user: { client_user_id: PRIMARY_USER_ID },
      client_name: "FinanceOS",
      products: accessToken ? undefined : config.products,
      country_codes: config.countryCodes,
      language: "en",
      redirect_uri: config.redirectUri || undefined,
      webhook: config.webhookUrl || undefined,
      access_token: accessToken,
    };

    try {
      console.log(
        `[PlaidService] Attempting link token create with clientId: ${config.clientId.substring(0, 6)}... (len: ${config.clientId.length}), secret: ${config.secret.substring(0, 4)}... (len: ${config.secret.length}), env: ${config.env}`,
      );
      const response = await plaidClient.linkTokenCreate(request);
      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
      };
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error_message || err?.message || "Failed to create Plaid Link token";
      console.error("[PlaidService] createLinkToken error:", errorMsg);
      throw new Error(`Plaid Link error: ${errorMsg}`);
    }
  }

  /**
   * Exchange Public Token for Access Token & Item ID, then store connection
   */
  static async exchangePublicToken(
    publicToken: string,
    metadata?: any,
  ): Promise<SafePlaidConnection> {
    const plaidClient = createPlaidClient();

    const request: ItemPublicTokenExchangeRequest = {
      public_token: publicToken,
    };

    try {
      const response = await plaidClient.itemPublicTokenExchange(request);
      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;

      const instId = metadata?.institution?.institution_id || "inst_unknown";
      const instName = metadata?.institution?.name || "Financial Institution";

      // Check if connection with this itemId already exists
      let connection = PlaidStore.getConnectionByItemId(itemId);
      const now = new Date().toISOString();

      if (connection) {
        connection.accessToken = accessToken;
        connection.institutionId = instId;
        connection.institutionName = instName;
        connection.status = "connected";
        connection.lastSyncedAt = now;
      } else {
        connection = {
          id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          itemId,
          accessToken,
          institutionId: instId,
          institutionName: instName,
          status: "connected",
          createdAt: now,
          lastSyncedAt: now,
          transactionCursor: null,
        };
      }

      PlaidStore.saveConnection(connection);

      // Immediately fetch and populate initial accounts
      await PlaidService.fetchAccounts(connection.id);

      const accounts = PlaidStore.getAccounts(connection.id);

      return {
        id: connection.id,
        itemId: connection.itemId,
        institutionId: connection.institutionId,
        institutionName: connection.institutionName,
        status: connection.status,
        createdAt: connection.createdAt,
        lastSyncedAt: connection.lastSyncedAt,
        accountCount: accounts.length,
      };
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error_message || err?.message || "Failed to exchange public token";
      console.error("[PlaidService] exchangePublicToken error:", errorMsg);
      throw new Error(`Token exchange error: ${errorMsg}`);
    }
  }

  /**
   * Fetch and normalize accounts & balances for a connection
   */
  static async fetchAccounts(connectionId: string): Promise<PlaidAccount[]> {
    const connection = PlaidStore.getConnectionById(connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const plaidClient = createPlaidClient();
    const request: AccountsGetRequest = {
      access_token: connection.accessToken,
    };

    try {
      const response = await plaidClient.accountsGet(request);
      const now = new Date().toISOString();

      const normalizedAccounts: PlaidAccount[] = response.data.accounts.map((acc) => ({
        id: `acc_${acc.account_id}`,
        plaidAccountId: acc.account_id,
        connectionId,
        institution: connection.institutionName,
        name: acc.name,
        officialName: acc.official_name || null,
        type: acc.type,
        subtype: acc.subtype || null,
        mask: acc.mask || null,
        currentBalance: acc.balances.current ?? 0,
        availableBalance: acc.balances.available ?? null,
        currency: acc.balances.iso_currency_code || acc.balances.unofficial_currency_code || "USD",
        source: "plaid",
        updatedAt: now,
      }));

      PlaidStore.saveAccounts(connectionId, normalizedAccounts);
      PlaidStore.updateStatus(connectionId, "connected");

      return normalizedAccounts;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error_message || err?.message;
      const errorCode = err?.response?.data?.error_code;
      if (errorCode === "ITEM_LOGIN_REQUIRED") {
        PlaidStore.updateStatus(connectionId, "reconnect_required");
      }
      console.error(`[PlaidService] fetchAccounts error for ${connectionId}:`, errorMsg);
      throw new Error(
        errorCode === "ITEM_LOGIN_REQUIRED" ? "ITEM_LOGIN_REQUIRED" : `Accounts error: ${errorMsg}`,
      );
    }
  }

  /**
   * Sync transactions incrementally using Plaid Sync API
   */
  static async syncTransactions(
    connectionId: string,
    options: { resetCursor?: boolean } = {},
  ): Promise<{
    added: Array<Record<string, unknown>>;
    modified: Array<Record<string, unknown>>;
    removed: Array<{ transaction_id?: string }>;
    totalAddedCount: number;
    accounts: PlaidAccount[];
  }> {
    const connection = PlaidStore.getConnectionById(connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const plaidClient = createPlaidClient();
    let cursor = options.resetCursor ? undefined : connection.transactionCursor || undefined;

    const allAdded: any[] = [];
    const allModified: any[] = [];
    const allRemoved: any[] = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const request: TransactionsSyncRequest = {
          access_token: connection.accessToken,
          cursor,
          count: 250,
        };

        const response = await plaidClient.transactionsSync(request);
        const data = response.data;

        allAdded.push(...data.added);
        allModified.push(...data.modified);
        allRemoved.push(...data.removed);

        hasMore = data.has_more;
        cursor = data.next_cursor;
      }

      const now = new Date().toISOString();
      if (cursor) {
        PlaidStore.updateCursor(connectionId, cursor, now);
      }

      // Also refresh accounts/balances during sync
      let accounts: PlaidAccount[] = [];
      try {
        accounts = await PlaidService.fetchAccounts(connectionId);
      } catch {
        accounts = PlaidStore.getAccounts(connectionId);
      }

      // Map raw Plaid transactions to FinanceOS normalized model
      const mappedAdded = allAdded.map((t) =>
        PlaidService.normalizeTransaction(t, connection.institutionName),
      );
      const mappedModified = allModified.map((t) =>
        PlaidService.normalizeTransaction(t, connection.institutionName),
      );
      const removedIds = allRemoved.map((r) => r.transaction_id).filter(Boolean);

      let allStored = PlaidStore.getTransactions(connectionId);
      if (options.resetCursor) {
        PlaidStore.saveTransactions(connectionId, mappedAdded);
        allStored = mappedAdded;
      } else {
        allStored = PlaidStore.appendTransactions(
          connectionId,
          mappedAdded,
          mappedModified,
          removedIds,
        );
      }

      return {
        added: mappedAdded,
        modified: mappedModified,
        removed: allRemoved,
        allStored,
        totalAddedCount: mappedAdded.length,
        accounts,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error_message || err?.message;
      const errorCode = err?.response?.data?.error_code;
      if (errorCode === "ITEM_LOGIN_REQUIRED") {
        PlaidStore.updateStatus(connectionId, "reconnect_required");
      }
      console.error(`[PlaidService] syncTransactions error for ${connectionId}:`, errorMsg);
      throw new Error(
        errorCode === "ITEM_LOGIN_REQUIRED" ? "ITEM_LOGIN_REQUIRED" : `Sync error: ${errorMsg}`,
      );
    }
  }

  /**
   * Remove Plaid Item and local connection
   */
  static async removeConnection(connectionId: string): Promise<boolean> {
    const connection = PlaidStore.getConnectionById(connectionId);
    if (!connection) {
      return false;
    }

    try {
      const plaidClient = createPlaidClient();
      const request: ItemRemoveRequest = {
        access_token: connection.accessToken,
      };
      await plaidClient.itemRemove(request);
    } catch (err: any) {
      console.warn(
        "[PlaidService] Item remove warning (proceeding with local cleanup):",
        err?.message,
      );
    }

    return PlaidStore.removeConnection(connectionId);
  }

  /**
   * Normalize Plaid transaction object into FinanceOS domain schema
   */
  private static normalizeTransaction(t: any, institutionName: string): Record<string, unknown> {
    // Plaid amounts are positive for expenses / debits, negative for credits / income
    const rawAmount = Number(t.amount || 0);
    const isIncome = rawAmount < 0;
    const finalAmount = Math.abs(rawAmount);

    const dateStr = t.date || new Date().toISOString().split("T")[0];
    const merchantName = t.merchant_name || t.name || "Unknown Merchant";
    const categoryName = Array.isArray(t.category) ? t.category[t.category.length - 1] : "Other";

    return {
      // Store full raw Plaid object so zero data is lost
      rawPlaid: t,
      ...t,

      // Normalized FinanceOS fields
      id: `plaid_${t.transaction_id}`,
      externalTransactionId: t.transaction_id,
      date: dateStr,
      description: t.name || merchantName,
      merchant: merchantName,
      amount: finalAmount,
      type: isIncome ? "income" : "expense",
      localCategory: categoryName,
      localConfidence: 0.9,
      finalCategory: categoryName,
      categorySource: "plaid",

      // FinanceOS legacy/compatibility fields
      merchant_raw: t.name || merchantName,
      merchant_normalized: merchantName,
      currency: t.iso_currency_code || t.unofficial_currency_code || "USD",
      category: categoryName,
      source: institutionName,
      card_identity: `${institutionName} (${t.account_id ? t.account_id.slice(-4) : "Plaid"})`,
      institution_name: institutionName,
      created_at: new Date().toISOString(),
    };
  }
}
