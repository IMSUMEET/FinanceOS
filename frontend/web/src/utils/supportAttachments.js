import {
  DEFAULT_MAX_ATTACHMENTS,
  DEFAULT_MAX_FILE_BYTES,
  validateFileAttachment,
  isImageAttachment,
} from "@oblivion-labs/arsenal-frontend";

export const MAX_SUPPORT_ATTACHMENTS = DEFAULT_MAX_ATTACHMENTS;
export const MAX_SUPPORT_FILE_BYTES = DEFAULT_MAX_FILE_BYTES;

export function validateSupportAttachment(file) {
  return validateFileAttachment(file, { maxBytes: MAX_SUPPORT_FILE_BYTES });
}

export { isImageAttachment };
