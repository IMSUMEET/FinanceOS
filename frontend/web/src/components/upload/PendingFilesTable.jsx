import { Trash2 } from "lucide-react";
import Badge from "../ui/Badge";
import { FORMAT_LABELS } from "../../constants/statementFormats";

function PendingFilesTable({ files, onRemove, disabled = false, compact = false }) {
  if (!files?.length) return null;

  return (
    <div
      className={[
        "w-full overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/60",
        compact ? "text-xs" : "text-sm",
      ].join(" ")}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50/50 text-xs font-semibold uppercase tracking-wider text-ink-500 dark:border-ink-800 dark:bg-ink-950/20 dark:text-ink-400">
            <th className={compact ? "px-3 py-2.5" : "px-5 py-3.5"}>File Name</th>
            <th className={compact ? "px-3 py-2.5" : "px-5 py-3.5"}>Detected Card / Format</th>
            <th className={compact ? "px-3 py-2.5 text-right" : "px-5 py-3.5 text-right"}>Rows</th>
            {!compact ? (
              <th className="px-5 py-3.5 text-right">Size</th>
            ) : null}
            <th className={compact ? "px-3 py-2.5 text-center" : "px-5 py-3.5 text-center"}>
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 dark:divide-ink-800/80">
          {files.map((pf, idx) => {
            const labelInfo = FORMAT_LABELS[pf.detectedFormat] || FORMAT_LABELS.unknown;
            return (
              <tr key={pf.name + idx} className="hover:bg-ink-50/30 dark:hover:bg-ink-950/10">
                <td
                  className={[
                    compact ? "max-w-[140px] px-3 py-2.5" : "max-w-[200px] px-5 py-3.5",
                    "truncate font-medium text-ink-900 dark:text-ink-50",
                  ].join(" ")}
                  title={pf.name}
                >
                  {pf.name}
                </td>
                <td className={compact ? "px-3 py-2.5" : "px-5 py-3.5"}>
                  <Badge tone={labelInfo.tone}>{labelInfo.label}</Badge>
                </td>
                <td
                  className={[
                    compact ? "px-3 py-2.5 text-right" : "px-5 py-3.5 text-right",
                    "font-mono text-ink-600 dark:text-ink-300",
                  ].join(" ")}
                >
                  {pf.rowCount}
                </td>
                {!compact ? (
                  <td className="px-5 py-3.5 text-right text-xs text-ink-500 dark:text-ink-400">
                    {(pf.size / 1024).toFixed(1)} KB
                  </td>
                ) : null}
                <td className={compact ? "px-3 py-2.5 text-center" : "px-5 py-3.5 text-center"}>
                  <button
                    type="button"
                    onClick={() => onRemove?.(idx)}
                    className="rounded p-1 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-350"
                    title="Remove file"
                    disabled={disabled}
                  >
                    <Trash2 size={compact ? 14 : 16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PendingFilesTable;
