const VARIANT_BG = {
  blue: "b6e3f4",
  violet: "c0aede",
  pink: "ffd5dc",
  emerald: "b6f4c7",
};

function buildAvatarUrl({ seed, variant, style = "personas" }) {
  const bg = VARIANT_BG[variant] ?? VARIANT_BG.blue;
  const params = new URLSearchParams({
    seed,
    backgroundColor: bg,
    radius: "50",
  });
  return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`;
}

function Avatar({
  seed = "Akshay",
  variant = "blue",
  size = 40,
  className = "",
  alt = "Profile avatar",
  rounded = true,
  ring = true,
}) {
  const url = buildAvatarUrl({ seed, variant });
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={{ width: size, height: size }}
      className={[
        "shrink-0 select-none object-cover",
        rounded ? "rounded-full" : "rounded-xl",
        ring ? "ring-2 ring-white dark:ring-ink-800" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export default Avatar;
