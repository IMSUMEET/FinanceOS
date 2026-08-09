import { describe, it, expect } from "vitest";
import { analyzeCsvBuffers, isCsvFileName } from "../src/csvAnalyze.js";

describe("isCsvFileName", () => {
  it("should match valid extensions", () => {
    expect(isCsvFileName("data.csv")).toBe(true);
    expect(isCsvFileName("data.xlsx")).toBe(true);
    expect(isCsvFileName("data.xls")).toBe(true);
    expect(isCsvFileName("data.txt")).toBe(false);
  });
});

describe("detectFormat via analyzeCsvBuffers", () => {
  const helper = async (headers: string[], filename = "test.csv") => {
    const dummyVals = headers.map((h, idx) => {
      const hl = h.toLowerCase();
      if (hl.includes("date") || hl.includes("trans") || hl.includes("post") || idx === 0)
        return "2026-06-20";
      if (
        hl.includes("amount") ||
        hl.includes("debit") ||
        hl.includes("credit") ||
        hl.includes("value") ||
        hl.includes("balance")
      )
        return "10.00";
      return "dummy";
    });
    const csvContent = headers.join(",") + "\r\n" + dummyVals.join(",") + "\r\n";
    const buffer = new TextEncoder().encode(csvContent).buffer;
    const res = await analyzeCsvBuffers([{ name: filename, buffer }]);
    return res.files[0]?.detectedFormat;
  };

  it("should detect Chase Checking", async () => {
    const fmt = await helper([
      "Details",
      "Posting Date",
      "Description",
      "Amount",
      "Type",
      "Balance",
      "Check or Slip #",
    ]);
    expect(fmt).toBe("chase_checking");
  });

  it("should detect Chase Credit Card", async () => {
    const fmt = await helper([
      "Transaction Date",
      "Post Date",
      "Description",
      "Category",
      "Type",
      "Amount",
      "Memo",
    ]);
    expect(fmt).toBe("chase_credit_card");
  });

  it("should detect Chase Amazon when file name matches", async () => {
    const fmt = await helper(
      ["Transaction Date", "Post Date", "Description", "Category", "Type", "Amount", "Memo"],
      "amazon_card.csv",
    );
    expect(fmt).toBe("chase_amazon");
  });

  it("should detect Amex Credit Card", async () => {
    const fmt = await helper([
      "Date",
      "Description",
      "Amount",
      "Appears on your statement as",
      "Reference",
      "Extended Details",
    ]);
    expect(fmt).toBe("amex_credit_card");
  });

  it("should detect Capital One Credit Card", async () => {
    const fmt = await helper([
      "Transaction Date",
      "Posted Date",
      "Card No.",
      "Description",
      "Category",
      "Debit",
      "Credit",
    ]);
    expect(fmt).toBe("capital_one_credit_card");
  });

  it("should detect Citi Credit Card", async () => {
    const fmt = await helper(["Status", "Date", "Description", "Debit", "Credit"]);
    expect(fmt).toBe("citi_credit_card");
  });

  it("should detect PlayStation Credit Card", async () => {
    const fmt = await helper(["Date", "Description", "Amount", "Location", "Category"]);
    expect(fmt).toBe("playstation_credit_card");
  });

  it("should detect Discover Credit Card", async () => {
    const fmt = await helper(["Trans. Date", "Post Date", "Description", "Amount", "Category"]);
    expect(fmt).toBe("discover_credit_card");
  });

  it("should detect Chase Checking with status column", async () => {
    const fmt = await helper([
      "Details",
      "Posting Date",
      "Description",
      "Amount",
      "Balance",
      "Status",
    ]);
    expect(fmt).toBe("chase_checking");
  });

  it("should detect Amex from file name when extended columns are absent", async () => {
    const fmt = await helper(["Date", "Description", "Amount"], "my-amex.csv");
    expect(fmt).toBe("amex_credit_card");
  });

  it("should return unknown for other formats", async () => {
    const fmt = await helper(["Date", "Amount", "Random"]);
    expect(fmt).toBe("unknown");
  });
});

describe("analyzeCsvBuffers", () => {
  it("should parse Chase checking CSV successfully", async () => {
    const csvContent =
      "Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\r\n" +
      "DEBIT,06/15/2026,STARBUCKS,-4.50,DEBIT,1200.00,\r\n" +
      "CREDIT,06/16/2026,Direct Deposit,2500.00,CREDIT,3700.00,\r\n";
    const buffer = new TextEncoder().encode(csvContent).buffer;

    const result = await analyzeCsvBuffers([{ name: "checking.csv", buffer }]);

    expect(result.status).toBe("success");
    expect(result.files[0]?.rowCount).toBe(2);
    expect(result.files[0]?.detectedFormat).toBe("chase_checking");
    expect(result.transactions.length).toBe(2);
    expect(result.transactions[0]?.amount).toBe(-4.5);
    expect(result.transactions[0]?.category).toBe("Food");
    expect(result.transactions[1]?.amount).toBe(2500.0);
    expect(result.transactions[1]?.category).toBe("Other"); // Matches updated rules/behavior
  });

  it("should parse Chase credit card CSV successfully", async () => {
    const csvContent =
      "Transaction Date,Post Date,Description,Category,Type,Amount,Memo\r\n" +
      "06/10/2026,06/11/2026,WHOLE FOODS,Groceries,Sale,-75.20,\r\n" +
      "06/12/2026,06/13/2026,AUTOMATIC PAYMENT - THANK,Payment,Payment,100.00,\r\n";
    const buffer = new TextEncoder().encode(csvContent).buffer;

    const result = await analyzeCsvBuffers([{ name: "chase_credit.csv", buffer }]);

    expect(result.status).toBe("success");
    expect(result.transactions[0]?.amount).toBe(-75.2);
    expect(result.transactions[0]?.category).toBe("Food");
    expect(result.transactions[1]?.amount).toBe(100);
  });

  it("should parse Capital One credit card CSV successfully with debits/credits", async () => {
    const csvContent =
      "Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\r\n" +
      "2026-06-10,2026-06-11,1234,Trader Joe's,Groceries,45.50,\r\n" +
      "2026-06-12,2026-06-13,1234,Payment received,,50.00\r\n";
    const buffer = new TextEncoder().encode(csvContent).buffer;

    const result = await analyzeCsvBuffers([{ name: "capitalone.csv", buffer }]);

    expect(result.status).toBe("success");
    expect(result.transactions[0]?.amount).toBe(-45.5); // debits represent outlays (negative)
    expect(result.transactions[0]?.category).toBe("Food");
  });

  it("should parse Excel (.xlsx) file successfully", async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      {
        Details: "DEBIT",
        "Posting Date": "06/15/2026",
        Description: "STARBUCKS",
        Amount: "-4.50",
        Type: "DEBIT",
        Balance: "1200.00",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const result = await analyzeCsvBuffers([{ name: "mock.xlsx", buffer }]);

    expect(result.status).toBe("success");
    expect(result.transactions[0]?.amount).toBe(-4.5);
    expect(result.transactions[0]?.category).toBe("Food");
  });

  it("throws detailed mapping errors on corrupted line data", async () => {
    const csvContent =
      "Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\r\n" +
      "DEBIT,invalid-date,STARBUCKS,invalid-amount,DEBIT,1200.00,\r\n";
    const buffer = new TextEncoder().encode(csvContent).buffer;

    await expect(analyzeCsvBuffers([{ name: "bad_data.csv", buffer }])).rejects.toThrow(
      'Error in "bad_data.csv" at line 2:',
    );
  });

  it("parses amex, discover, playstation, and citi costco formats", async () => {
    const amexCsv =
      "Date,Description,Amount,Appears on your statement as,Reference,Extended Details\r\n" +
      "06/15/2026,Store,12.00,Store,Ref,Details\r\n";
    const discoverCsv =
      "Trans. Date,Post Date,Description,Amount,Category\r\n" +
      "06/15/2026,06/16/2026,Store,15.00,Shopping\r\n";
    const playstationCsv =
      "Date,Description,Amount,Location,Category\r\n" +
      "06/15/2026,Payment,100.00,Online,Payment\r\n" +
      "06/16/2026,Game,20.00,Online,Purchase\r\n";
    const citiCsv =
      "Status,Date,Description,Debit,Credit\r\n" + "Posted,06/15/2026,Store,10.00,\r\n";

    const amex = await analyzeCsvBuffers([
      { name: "amex.csv", buffer: new TextEncoder().encode(amexCsv).buffer },
    ]);
    expect(amex.transactions[0]?.amount).toBe(-12);

    const discover = await analyzeCsvBuffers([
      { name: "discover.csv", buffer: new TextEncoder().encode(discoverCsv).buffer },
    ]);
    expect(discover.transactions[0]?.amount).toBe(-15);

    const playstation = await analyzeCsvBuffers([
      { name: "ps.csv", buffer: new TextEncoder().encode(playstationCsv).buffer },
    ]);
    expect(playstation.transactions[1]?.amount).toBe(-20);

    const citi = await analyzeCsvBuffers([
      { name: "costco.csv", buffer: new TextEncoder().encode(citiCsv).buffer },
    ]);
    expect(citi.transactions[0]?.card_identity).toBe("Costco Credit Card");
  });

  it("merges multiple files and builds positive and negative insight messages", async () => {
    const spendCsv =
      "Details,Posting Date,Description,Amount,Type,Balance\r\n" +
      "DEBIT,06/15/2026,Store,-100.00,DEBIT,100.00\r\n";
    const incomeCsv =
      "Details,Posting Date,Description,Amount,Type,Balance\r\n" +
      "CREDIT,06/16/2026,Payroll,500.00,CREDIT,600.00\r\n";

    const negative = await analyzeCsvBuffers([
      { name: "spend.csv", buffer: new TextEncoder().encode(spendCsv).buffer },
    ]);
    expect(negative.insights.some((line) => line.includes("negative"))).toBe(true);

    const positive = await analyzeCsvBuffers([
      { name: "income.csv", buffer: new TextEncoder().encode(incomeCsv).buffer },
    ]);
    expect(positive.insights.some((line) => line.includes("positive"))).toBe(true);
  });

  it("reads Sheet2 and Transaction Details tabs from excel workbooks", async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["ignore"]]), "Sheet1");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          "Posting Date": "06/15/2026",
          Description: "STARBUCKS",
          Amount: "-4.50",
          Type: "DEBIT",
          Balance: "1200.00",
          Details: "DEBIT",
        },
      ]),
      "Sheet2",
    );
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const result = await analyzeCsvBuffers([{ name: "sheet2.xlsx", buffer }]);
    expect(result.transactions[0]?.merchant_normalized).toBe("Starbucks");
  });

  it("parses capital one credit column payments", async () => {
    const csvContent =
      "Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\r\n" +
      "2026-06-12,2026-06-13,1234,Payment received,,,50.00\r\n";
    const buffer = new TextEncoder().encode(csvContent).buffer;
    const result = await analyzeCsvBuffers([{ name: "capitalone.csv", buffer }]);
    expect(result.transactions[0]?.amount).toBe(50);
  });

  it("throws CSV_PARSE_ERROR when PapaParse reports errors on empty data", async () => {
    const buffer = new TextEncoder().encode("").buffer;
    await expect(analyzeCsvBuffers([{ name: "empty.csv", buffer }])).rejects.toThrow(
      "CSV_PARSE_ERROR:empty.csv",
    );
  });

  it("covers unknown-format sign handling and debit/credit error branches", async () => {
    const unknownCsv =
      "Date,Description,Amount\r\n" + "06/15/2026,Refund,25.00\r\n" + "06/16/2026,Store,-12.00\r\n";
    const unknown = await analyzeCsvBuffers([
      { name: "generic.csv", buffer: new TextEncoder().encode(unknownCsv).buffer },
    ]);
    expect(unknown.transactions[0]?.amount).toBe(-25);
    expect(unknown.transactions[1]?.amount).toBe(-12);

    const citiBad = "Status,Date,Description,Debit,Credit\r\n" + "Posted,06/15/2026,Store,,\r\n";
    await expect(
      analyzeCsvBuffers([{ name: "citi.csv", buffer: new TextEncoder().encode(citiBad).buffer }]),
    ).rejects.toThrow(/Missing or invalid amount/);

    const capBad =
      "Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\r\n" +
      "2026-06-10,2026-06-11,1234,Store,Groceries,,\r\n";
    await expect(
      analyzeCsvBuffers([
        { name: "capitalone.csv", buffer: new TextEncoder().encode(capBad).buffer },
      ]),
    ).rejects.toThrow(/Missing or invalid amount/);
  });

  it("uses Transaction Details sheet when present", async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["ignore"]]), "Sheet1");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          "Posting Date": "06/15/2026",
          Description: "WHOLE FOODS",
          Amount: "-20.00",
          Type: "DEBIT",
          Balance: "100.00",
          Details: "DEBIT",
        },
      ]),
      "Transaction Details",
    );
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const result = await analyzeCsvBuffers([{ name: "details.xlsx", buffer }]);
    expect(result.transactions[0]?.category).toBe("Food");
  });
});
