function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-ink-100/80 dark:bg-ink-800/60 ${className}`}
      aria-hidden
    />
  );
}

export default Skeleton;
