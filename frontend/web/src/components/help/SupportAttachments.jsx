import { useEffect, useMemo, useRef } from "react";
import { FileText, ImagePlus, Paperclip, X } from "lucide-react";
import {
  MAX_SUPPORT_ATTACHMENTS,
  isImageAttachment,
  validateSupportAttachment,
} from "../../utils/supportAttachments";

function AttachmentPreview({ file, onRemove }) {
  const image = isImageAttachment(file);
  const url = useMemo(() => (image ? URL.createObjectURL(file) : null), [file, image]);

  useEffect(() => {
    if (!url) return undefined;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <div className="group relative shrink-0">
      {image && url ? (
        <div className="h-16 w-16 overflow-hidden rounded-xl2 border border-ink-200 bg-ink-50 dark:border-ink-600 dark:bg-ink-800">
          <img src={url} alt={file.name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl2 border border-ink-200 bg-ink-50 px-1 dark:border-ink-600 dark:bg-ink-800">
          <FileText size={18} className="text-ink-500 dark:text-ink-400" />
          <span className="max-w-full truncate px-1 text-[9px] font-semibold text-ink-600 dark:text-ink-300">
            {file.name.split(".").pop()?.toUpperCase()}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 dark:border-ink-600 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
      >
        <X size={12} />
      </button>
      <p className="mt-1 max-w-16 truncate text-[10px] text-ink-500 dark:text-ink-400">
        {file.name}
      </p>
    </div>
  );
}

function SupportAttachments({ attachments, onChange, disabled = false }) {
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []).filter(Boolean);
    if (!incoming.length) return;

    const next = [...attachments];
    for (const file of incoming) {
      if (next.length >= MAX_SUPPORT_ATTACHMENTS) break;
      const err = validateSupportAttachment(file);
      if (err) {
        onChange(next, err);
        return;
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      next.push(file);
    }
    onChange(next, "");
  }

  function removeAt(index) {
    onChange(
      attachments.filter((_, i) => i !== index),
      "",
    );
  }

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
        <Paperclip size={14} />
        Attachments
        <span className="font-normal normal-case tracking-normal text-ink-400 dark:text-ink-500">
          (optional)
        </span>
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={[
          "rounded-xl2 border border-dashed border-ink-300 bg-ink-50/50 px-4 py-4 transition dark:border-ink-600 dark:bg-ink-800/40",
          disabled
            ? "pointer-events-none opacity-60"
            : "hover:border-brand-400/60 dark:hover:border-brand-500/50",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-3">
          {attachments.map((file, index) => (
            <AttachmentPreview
              key={`${file.name}-${file.size}-${index}`}
              file={file}
              onRemove={() => removeAt(index)}
            />
          ))}

          {attachments.length < MAX_SUPPORT_ATTACHMENTS ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl2 border border-ink-200 bg-white text-ink-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-ink-600 dark:bg-ink-800/80 dark:text-ink-300 dark:hover:border-brand-500 dark:hover:text-brand-300"
            >
              <ImagePlus size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wide">Add</span>
            </button>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-ink-500 dark:text-ink-400">
          Images, PDF, CSV, or documents · up to {MAX_SUPPORT_ATTACHMENTS} files · 5 MB each
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.csv,.txt,.xlsx,.xls,.doc,.docx"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export default SupportAttachments;
