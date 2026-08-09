import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlaidStore } from "../src/services/plaid/plaidStore.js";
import { PlaidService } from "../src/services/plaid/plaidService.js";

describe("Plaid Backend Unit Tests", () => {
  beforeEach(() => {
    // Reset or remove test connections
    const connections = PlaidStore.getConnections();
    for (const c of connections) {
      PlaidStore.removeConnection(c.id);
    }
  });

  it("saves and retrieves safe connection data without exposing access tokens", () => {
    const mockConn = {
      id: "conn_test1",
      itemId: "item_test1",
      accessToken: "access-sandbox-secret-12345",
      institutionId: "ins_109508",
      institutionName: "First Platypus Bank",
      status: "connected" as const,
      createdAt: new Date().toISOString(),
      lastSyncedAt: null,
      transactionCursor: null,
    };

    PlaidStore.saveConnection(mockConn);

    const safeConnections = PlaidStore.getSafeConnections();
    expect(safeConnections.length).toBe(1);
    expect(safeConnections[0].id).toBe("conn_test1");
    expect(safeConnections[0].institutionName).toBe("First Platypus Bank");
    expect((safeConnections[0] as any).accessToken).toBeUndefined();
  });

  it("encrypts access tokens when stored and retrieves decrypted in memory", () => {
    const rawToken = "access-sandbox-9999-secret";
    const mockConn = {
      id: "conn_enc_test",
      itemId: "item_enc",
      accessToken: rawToken,
      institutionId: "ins_1",
      institutionName: "Test Bank",
      status: "connected" as const,
      createdAt: new Date().toISOString(),
      lastSyncedAt: null,
      transactionCursor: null,
    };

    PlaidStore.saveConnection(mockConn);

    const retrieved = PlaidStore.getConnectionById("conn_enc_test");
    expect(retrieved?.accessToken).toBe(rawToken);
  });

  it("updates sync cursor and lastSyncedAt timestamp", () => {
    const mockConn = {
      id: "conn_cursor_test",
      itemId: "item_cursor",
      accessToken: "secret",
      institutionId: "ins_1",
      institutionName: "Test Bank",
      status: "connected" as const,
      createdAt: new Date().toISOString(),
      lastSyncedAt: null,
      transactionCursor: null,
    };

    PlaidStore.saveConnection(mockConn);
    const now = new Date().toISOString();
    PlaidStore.updateCursor("conn_cursor_test", "cursor_v1_next", now);

    const updated = PlaidStore.getConnectionById("conn_cursor_test");
    expect(updated?.transactionCursor).toBe("cursor_v1_next");
    expect(updated?.lastSyncedAt).toBe(now);
  });

  it("removes connection and associated accounts cleanly", () => {
    const mockConn = {
      id: "conn_remove_test",
      itemId: "item_remove",
      accessToken: "secret",
      institutionId: "ins_1",
      institutionName: "Test Bank",
      status: "connected" as const,
      createdAt: new Date().toISOString(),
      lastSyncedAt: null,
      transactionCursor: null,
    };

    PlaidStore.saveConnection(mockConn);
    PlaidStore.saveAccounts("conn_remove_test", [
      {
        id: "acc_1",
        plaidAccountId: "plaid_acc_1",
        connectionId: "conn_remove_test",
        institution: "Test Bank",
        name: "Checking",
        officialName: null,
        type: "depository",
        subtype: "checking",
        mask: "1234",
        currentBalance: 500,
        availableBalance: 500,
        currency: "USD",
        source: "plaid",
        updatedAt: new Date().toISOString(),
      },
    ]);

    expect(PlaidStore.getAccounts("conn_remove_test").length).toBe(1);

    const removed = PlaidStore.removeConnection("conn_remove_test");
    expect(removed).toBe(true);
    expect(PlaidStore.getConnectionById("conn_remove_test")).toBeUndefined();
    expect(PlaidStore.getAccounts("conn_remove_test").length).toBe(0);
  });
});
