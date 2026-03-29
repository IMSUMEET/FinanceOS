import { useNavigate } from "react-router-dom";

type BackButtonProps = {
  label?: string;
  to?: string;
};

export default function BackButton({ label = "Back", to }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        if (to) {
          navigate(to);
          return;
        }

        navigate(-1);
      }}
      className="inline-flex items-center gap-3 rounded-full border border-theme bg-surface-strong px-4 py-2.5 text-sm font-semibold text-primary-theme shadow-soft transition hover:-translate-y-0.5 hover:bg-surface"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-lg">
        ←
      </span>
      <span>{label}</span>
    </button>
  );
}
