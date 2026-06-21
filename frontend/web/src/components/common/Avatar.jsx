import React from "react";

function Avatar({
  variant = "blue",
  size = 40,
  className = "",
  alt = "Profile avatar",
  rounded = true,
  ring = true,
}) {
  const resolvedVariant = ["blue", "violet", "emerald", "amber"].includes(variant)
    ? variant
    : "blue";

  return (
    <div
      role="img"
      aria-label={alt}
      style={{ width: size, height: size }}
      className={[
        "shrink-0 select-none overflow-hidden relative shadow-soft",
        rounded ? "rounded-full" : "rounded-xl2",
        ring ? "ring-2 ring-white dark:ring-ink-800" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%" className="w-full h-full block">
        <defs>
          {/* Background Gradients */}
          <linearGradient id="bg-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="bg-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="bg-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="bg-amber" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Claymorphic Skin Highlight Gradient */}
          <radialGradient id="skin" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffeedd" />
            <stop offset="60%" stopColor="#fcd34d" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.35" />
          </radialGradient>

          <linearGradient id="skin-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdf4ff" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>

          {/* Clay Shadow filter */}
          <filter id="clay-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow
              dx="1"
              dy="2"
              stdDeviation="1.5"
              floodColor="#0f172a"
              floodOpacity="0.15"
            />
          </filter>
        </defs>

        {/* 1. Background Circle */}
        <circle cx="60" cy="60" r="60" fill={`url(#bg-${resolvedVariant})`} />

        {/* 2. Character Body (Neck, Shoulders/Clothes) */}
        {resolvedVariant === "blue" && (
          <g>
            <rect x="52" y="80" width="16" height="15" rx="4" fill="url(#skin-base)" />
            {/* Dark Blue Suit / Teal Crewneck */}
            <path
              d="M 28 104 C 28 92, 42 86, 60 86 C 78 86, 92 92, 92 104 Z"
              fill="#0f172a"
              filter="url(#clay-shadow)"
            />
            <path d="M 52 86 L 60 96 L 68 86 Z" fill="#ffffff" />
            {/* Emerald tie detail */}
            <path d="M 58 96 L 62 96 L 64 108 L 60 112 L 56 108 Z" fill="#0d9488" />
          </g>
        )}

        {resolvedVariant === "violet" && (
          <g>
            <rect x="52" y="80" width="16" height="15" rx="4" fill="url(#skin-base)" />
            {/* Lilac Turtleneck */}
            <path
              d="M 26 104 C 26 90, 40 85, 60 85 C 80 85, 94 90, 94 104 Z"
              fill="#c0aede"
              filter="url(#clay-shadow)"
            />
            <rect x="46" y="80" width="28" height="10" rx="3" fill="#8b5cf6" />
          </g>
        )}

        {resolvedVariant === "emerald" && (
          <g>
            <rect x="52" y="80" width="16" height="15" rx="4" fill="url(#skin-base)" />
            {/* Premium Gold/Emerald Hoodie */}
            <path
              d="M 26 104 C 26 92, 40 86, 60 86 C 80 86, 94 92, 94 104 Z"
              fill="#065f46"
              filter="url(#clay-shadow)"
            />
            {/* Orange drawstring hood collar */}
            <path
              d="M 44 86 C 44 94, 76 94, 76 86"
              stroke="#fb923c"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {resolvedVariant === "amber" && (
          <g>
            <rect x="52" y="80" width="16" height="15" rx="4" fill="url(#skin-base)" />
            {/* Futuristic Tech Mint Jacket */}
            <path
              d="M 26 104 C 26 92, 40 86, 60 86 C 80 86, 94 92, 94 104 Z"
              fill="#0f766e"
              filter="url(#clay-shadow)"
            />
            <path d="M 44 86 L 60 102 L 76 86 Z" fill="#fb7185" />
          </g>
        )}

        {/* 3. Head & Face (common base) */}
        <circle cx="60" cy="60" r="28" fill="url(#skin-base)" />
        <circle cx="60" cy="60" r="28" fill="url(#skin)" opacity="0.9" />

        {/* Blush Cheeks */}
        <circle cx="44" cy="66" r="4" fill="#fda4af" opacity="0.6" />
        <circle cx="76" cy="66" r="4" fill="#fda4af" opacity="0.6" />

        {/* Eyes & Smile */}
        <circle cx="48" cy="56" r="3" fill="#0f172a" />
        <circle cx="49" cy="55" r="1.1" fill="#ffffff" />

        <circle cx="72" cy="56" r="3" fill="#0f172a" />
        <circle cx="73" cy="55" r="1.1" fill="#ffffff" />

        <path
          d="M 54 70 Q 60 75, 66 70"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* 4. Variant-Specific Hair and Accessories */}
        {resolvedVariant === "blue" && (
          <g>
            {/* Side-swept clay hair */}
            <path
              d="M 32 60 Q 32 30, 60 30 Q 88 30, 88 60 C 88 46, 78 40, 60 40 C 42 40, 32 46, 32 60 Z"
              fill="#1e293b"
              filter="url(#clay-shadow)"
            />
            <path
              d="M 32 50 C 38 42, 54 42, 62 48"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Rounded blue clay glasses */}
            <g opacity="0.95" filter="url(#clay-shadow)">
              <circle cx="48" cy="56" r="9" fill="none" stroke="#0d9488" strokeWidth="2.5" />
              <circle cx="72" cy="56" r="9" fill="none" stroke="#0d9488" strokeWidth="2.5" />
              <path d="M 57 56 L 63 56" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </g>
        )}

        {resolvedVariant === "violet" && (
          <g>
            {/* Short wavy clay hair */}
            <path
              d="M 32 60 C 26 38, 94 38, 88 60 C 88 44, 78 36, 60 36 C 42 36, 32 44, 32 60 Z"
              fill="#475569"
              filter="url(#clay-shadow)"
            />
            <path
              d="M 34 52 Q 48 44, 60 48 Q 72 44, 86 52"
              stroke="#1e293b"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Chic wireless headphones */}
            <path
              d="M 32 60 Q 32 24, 60 24 Q 88 24, 88 60"
              stroke="#a78bfa"
              strokeWidth="3"
              fill="none"
            />
            <rect x="29" y="50" width="6" height="14" rx="3" fill="#8b5cf6" />
            <rect x="85" y="50" width="6" height="14" rx="3" fill="#8b5cf6" />
          </g>
        )}

        {resolvedVariant === "emerald" && (
          <g>
            {/* Warm Beanie Hat */}
            <path d="M 32 48 C 32 26, 88 26, 88 48 Z" fill="#f59e0b" filter="url(#clay-shadow)" />
            <rect
              x="28"
              y="44"
              width="64"
              height="8"
              rx="3"
              fill="#d97706"
              filter="url(#clay-shadow)"
            />
            <circle cx="60" cy="22" r="5" fill="#f59e0b" filter="url(#clay-shadow)" />
          </g>
        )}

        {resolvedVariant === "amber" && (
          <g>
            {/* Cool modern spiky hair */}
            <path
              d="M 32 60 C 28 36, 92 36, 88 60 C 90 48, 80 40, 60 40 C 40 40, 30 48, 32 60 Z"
              fill="#1e293b"
              filter="url(#clay-shadow)"
            />
            <path
              d="M 36 40 L 44 26 L 50 36 L 60 22 L 70 36 L 76 26 L 84 40 Z"
              fill="#0f172a"
              filter="url(#clay-shadow)"
            />
            {/* Sleek matte clay sunglasses */}
            <g filter="url(#clay-shadow)">
              <rect x="36" y="50" width="48" height="8" rx="2" fill="#1e293b" />
              <rect x="38" y="50" width="18" height="10" rx="3" fill="#0f172a" />
              <rect x="64" y="50" width="18" height="10" rx="3" fill="#0f172a" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

export default Avatar;
