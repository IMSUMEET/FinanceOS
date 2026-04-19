function ClayButton({ children, icon: Icon, variant = "default", className = "", ...props }) {
  const styles = {
    default: "bg-slate-100 text-slate-900 shadow-md border border-white/60 hover:-translate-y-0.5",
    primary:
      "text-white border border-white/20 shadow-[14px_14px_30px_rgba(181,190,232,0.55),-12px_-12px_26px_rgba(255,255,255,0.92)] bg-gradient-to-r from-indigo-500 to-indigo-600 hover:-translate-y-0.5",
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition duration-300 ${styles[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}

export default ClayButton;
