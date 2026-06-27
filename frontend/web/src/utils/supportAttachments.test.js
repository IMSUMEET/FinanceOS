import { describe, it, expect } from "vitest";
import {
  MAX_SUPPORT_ATTACHMENTS,
  MAX_SUPPORT_FILE_BYTES,
  validateSupportAttachment,
  isImageAttachment,
} from "./supportAttachments.js";

function mockFile(name, type, size) {
  return { name, type, size };
}

describe("supportAttachments (Arsenal-backed)", () => {
  it("exports FinanceOS limits", () => {
    expect(MAX_SUPPORT_ATTACHMENTS).toBe(5);
    expect(MAX_SUPPORT_FILE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("accepts valid PDF attachments", () => {
    expect(validateSupportAttachment(mockFile("report.pdf", "application/pdf", 1024))).toBeNull();
  });

  it("accepts image attachments by mime type", () => {
    expect(validateSupportAttachment(mockFile("photo.png", "image/png", 1024))).toBeNull();
  });

  it("rejects oversize files", () => {
    const msg = validateSupportAttachment(
      mockFile("big.pdf", "application/pdf", MAX_SUPPORT_FILE_BYTES + 1),
    );
    expect(msg).toMatch(/too large/i);
  });

  it("rejects unsupported extensions", () => {
    const msg = validateSupportAttachment(mockFile("script.exe", "application/octet-stream", 100));
    expect(msg).toMatch(/not a supported type/i);
  });

  it("detects image attachments by extension fallback", () => {
    expect(isImageAttachment(mockFile("pic.jpg", "", 100))).toBe(true);
    expect(isImageAttachment(mockFile("doc.pdf", "application/pdf", 100))).toBe(false);
  });
});
