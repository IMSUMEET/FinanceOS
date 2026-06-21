export const MAX_SUPPORT_ATTACHMENTS = 5;
export const MAX_SUPPORT_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_EXT = /\.(jpe?g|png|gif|webp|pdf|csv|txt|xlsx?|docx?)$/i;

export function validateSupportAttachment(file) {
  if (!file) return "Invalid file.";
  if (file.size > MAX_SUPPORT_FILE_BYTES) {
    return `"${file.name}" is too large. Each file must be 5 MB or smaller.`;
  }
  const isImage = file.type.startsWith("image/");
  if (!isImage && !ALLOWED_EXT.test(file.name)) {
    return `"${file.name}" is not a supported type. Use images, PDF, CSV, or common documents.`;
  }
  return null;
}

export function isImageAttachment(file) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(file.name);
}
