import { Hono } from "hono";
import { cors } from "hono/cors";
import { analyzeCsvBuffers, MAX_CSV_BYTES, isCsvFileName } from "./csvAnalyze.js";

export const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowHeaders: ["Content-Type", "Authorization", "Accept"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 300,
  }),
);

app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "finance-os-api",
    hint: "POST /api/analyze (multipart CSV) or GET /health.",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

function collectUploadFiles(body: Record<string, unknown>): File[] {
  const files: File[] = [];
  for (const v of Object.values(body)) {
    if (v instanceof File) {
      files.push(v);
      continue;
    }
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item instanceof File) files.push(item);
      }
    }
  }
  return files;
}

function csvMimeOk(mime: string): boolean {
  if (!mime) return true;
  const m = mime.toLowerCase();
  if (m === "application/octet-stream") return true;
  if (
    m === "application/csv" ||
    m === "application/vnd.ms-excel" ||
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return true;
  if (m.startsWith("text/")) return true;
  return false;
}

app.post("/api/analyze", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return c.json(
      {
        status: "error",
        message: "Expected multipart/form-data.",
        code: "INVALID_CONTENT_TYPE",
      },
      400,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await c.req.parseBody({ all: true })) as Record<string, unknown>;
  } catch {
    return c.json(
      {
        status: "error",
        message: "Could not read upload. Try a smaller file or fewer files at once.",
        code: "MULTIPART_READ_FAILED",
      },
      400,
    );
  }

  const files = collectUploadFiles(body);
  if (!files.length) {
    return c.json(
      {
        status: "error",
        message: 'No files found. Append files with the field name "files".',
        code: "MISSING_FILES",
      },
      400,
    );
  }

  for (const f of files) {
    const name = f.name || "upload";
    if (!isCsvFileName(name)) {
      return c.json(
        {
          status: "error",
          message: "Only .csv, .xlsx, or .xls files are accepted.",
          code: "INVALID_FILE_TYPE",
        },
        400,
      );
    }
    if (!csvMimeOk(f.type ?? "")) {
      return c.json(
        {
          status: "error",
          message: "Each part must be a CSV or Excel file.",
          code: "INVALID_FILE_TYPE",
        },
        400,
      );
    }
    if (f.size > MAX_CSV_BYTES) {
      return c.json(
        {
          status: "error",
          message: "Each file must be 5 MB or smaller.",
          code: "FILE_TOO_LARGE",
        },
        413,
      );
    }
  }

  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  try {
    const buffers = await Promise.all(
      files.map(async (f) => ({
        name: f.name || "upload.csv",
        buffer: await f.arrayBuffer(),
      })),
    );

    const result = await analyzeCsvBuffers(buffers);
    console.log(
      JSON.stringify({
        event: "analyze",
        fileCount: files.length,
        totalBytes,
        transactionCount: result.transactions.length,
        outcome: "success",
      }),
    );
    return c.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    console.log(
      JSON.stringify({
        event: "analyze",
        fileCount: files.length,
        totalBytes,
        outcome: "failure",
        errorCode: msg.startsWith("CSV_PARSE_ERROR") ? "CSV_PARSE_ERROR" : "ANALYZE_FAILED",
      }),
    );
    if (msg.startsWith("CSV_PARSE_ERROR")) {
      return c.json(
        {
          status: "error",
          message: "A CSV could not be parsed. Check delimiter and headers.",
          code: "CSV_PARSE_ERROR",
        },
        400,
      );
    }
    return c.json(
      {
        status: "error",
        message: "Analysis failed. Try again with a different export.",
        code: "ANALYZE_FAILED",
      },
      500,
    );
  }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUPPORT_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_SUPPORT_ATTACHMENTS = 5;

function collectNamedFiles(body: Record<string, unknown>, fieldName: string): File[] {
  const value = body[fieldName];
  if (value instanceof File) return [value];
  if (Array.isArray(value)) return value.filter((item): item is File => item instanceof File);
  return [];
}

function isSupportAttachmentName(name: string): boolean {
  return /\.(jpe?g|png|gif|webp|pdf|csv|txt|xlsx?|docx?)$/i.test(name);
}

function supportAttachmentMimeOk(mime: string, name: string): boolean {
  if (!mime) return isSupportAttachmentName(name);
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return true;
  if (m === "application/pdf") return true;
  if (m === "application/octet-stream") return isSupportAttachmentName(name);
  if (m.startsWith("text/")) return true;
  if (
    m === "application/vnd.ms-excel" ||
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    m === "application/msword" ||
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return true;
  }
  return false;
}

function validateSupportAttachments(files: File[]): string | null {
  if (files.length > MAX_SUPPORT_ATTACHMENTS) {
    return `You can attach up to ${MAX_SUPPORT_ATTACHMENTS} files.`;
  }
  for (const file of files) {
    const name = file.name || "upload";
    if (!isSupportAttachmentName(name) && !file.type.startsWith("image/")) {
      return "Unsupported attachment type. Use images, PDF, CSV, or common documents.";
    }
    if (!supportAttachmentMimeOk(file.type ?? "", name)) {
      return "Unsupported attachment type. Use images, PDF, CSV, or common documents.";
    }
    if (file.size > MAX_SUPPORT_ATTACHMENT_BYTES) {
      return "Each attachment must be 5 MB or smaller.";
    }
  }
  return null;
}

app.post("/api/support", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  let name = "";
  let email = "";
  let subject = "";
  let message = "";
  let attachments: File[] = [];

  if (contentType.toLowerCase().includes("multipart/form-data")) {
    let body: Record<string, unknown>;
    try {
      body = (await c.req.parseBody({ all: true })) as Record<string, unknown>;
    } catch {
      return c.json({ ok: false, message: "Could not read upload. Try smaller attachments." }, 400);
    }

    name = String(body.name ?? "").trim();
    email = String(body.email ?? "").trim();
    subject = String(body.subject ?? "").trim();
    message = String(body.message ?? "").trim();
    attachments = collectNamedFiles(body, "attachments");
  } else {
    let body: { name?: string; email?: string; subject?: string; message?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, message: "Invalid JSON body." }, 400);
    }

    name = String(body.name ?? "").trim();
    email = String(body.email ?? "").trim();
    subject = String(body.subject ?? "").trim();
    message = String(body.message ?? "").trim();
  }

  if (!name || !email || !subject || !message) {
    return c.json({ ok: false, message: "All fields are required." }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return c.json({ ok: false, message: "Invalid email address." }, 400);
  }
  if (message.length > 5000) {
    return c.json({ ok: false, message: "Message is too long." }, 400);
  }

  const attachmentError = validateSupportAttachments(attachments);
  if (attachmentError) {
    return c.json({ ok: false, message: attachmentError }, 400);
  }

  const to = process.env.SUPPORT_TO_EMAIL ?? "support@financeos.local";
  console.log(
    JSON.stringify({
      event: "support",
      to,
      from: email,
      name,
      subject,
      messagePreview: message.slice(0, 200),
      attachments: attachments.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    }),
  );

  return c.json({
    ok: true,
    message: "Thanks — your message was received. We'll reply by email soon.",
  });
});
