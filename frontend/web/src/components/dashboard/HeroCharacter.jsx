import { motion as Motion } from "framer-motion";

const VARIANTS = {
  blue: {
    sweater: "#2563eb",
    sweaterDeep: "#1d4ed8",
    accent: "#8b5cf6",
    laptopAccent: "#a78bfa",
  },
  violet: {
    sweater: "#7c3aed",
    sweaterDeep: "#5b21b6",
    accent: "#22d3ee",
    laptopAccent: "#67e8f9",
  },
  emerald: {
    sweater: "#10b981",
    sweaterDeep: "#047857",
    accent: "#f59e0b",
    laptopAccent: "#fbbf24",
  },
  amber: {
    sweater: "#f59e0b",
    sweaterDeep: "#b45309",
    accent: "#3b82f6",
    laptopAccent: "#60a5fa",
  },
};

function HeroCharacter({ variant = "blue", size = 320, className = "" }) {
  const colors = VARIANTS[variant] ?? VARIANTS.blue;

  return (
    <Motion.svg
      viewBox="0 0 320 320"
      width={size}
      height={size}
      role="img"
      aria-label="Friendly finance buddy with a laptop"
      className={className}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <radialGradient id={`halo-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`sweater-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.sweater} />
          <stop offset="100%" stopColor={colors.sweaterDeep} />
        </linearGradient>
        <linearGradient id={`screen-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.accent} />
          <stop offset="100%" stopColor={colors.laptopAccent} />
        </linearGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8d2b0" />
          <stop offset="100%" stopColor="#e9b48a" />
        </linearGradient>
      </defs>

      {/* Soft halo behind everything */}
      <circle cx="160" cy="160" r="140" fill={`url(#halo-${variant})`} />

      {/* Floating sparkles */}
      <Motion.g
        animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="60" cy="80" r="4" fill={colors.accent} />
      </Motion.g>
      <Motion.g
        animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      >
        <circle cx="260" cy="70" r="5" fill={colors.sweater} />
      </Motion.g>
      <Motion.g
        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <circle cx="270" cy="200" r="3.5" fill={colors.laptopAccent} />
      </Motion.g>

      {/* Drop shadow under character */}
      <ellipse cx="160" cy="282" rx="72" ry="9" fill="#0f172a" opacity="0.12" />

      {/* Body group */}
      <g>
        {/* Legs */}
        <rect x="118" y="232" width="38" height="42" rx="14" fill="#1e293b" />
        <rect x="164" y="232" width="38" height="42" rx="14" fill="#1e293b" />

        {/* Sweater / torso */}
        <path
          d="M 95 175 Q 95 145, 130 140 L 190 140 Q 225 145, 225 175 L 225 240 Q 160 252, 95 240 Z"
          fill={`url(#sweater-${variant})`}
        />

        {/* Sweater highlight */}
        <path
          d="M 110 165 Q 130 152, 160 152 Q 190 152, 210 165"
          stroke="#ffffff"
          strokeOpacity="0.18"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Neck */}
        <rect x="146" y="124" width="28" height="22" rx="8" fill="url(#skin)" />

        {/* Head */}
        <circle cx="160" cy="100" r="40" fill="url(#skin)" />

        {/* Hair */}
        <path
          d="M 122 92 Q 122 60, 160 58 Q 198 60, 198 92 Q 196 80, 178 78 Q 170 88, 154 86 Q 138 84, 130 92 Z"
          fill="#0f172a"
        />

        {/* Eyes */}
        <circle cx="148" cy="102" r="3" fill="#0f172a" />
        <circle cx="172" cy="102" r="3" fill="#0f172a" />

        {/* Smile */}
        <path
          d="M 152 116 Q 160 122, 168 116"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheeks */}
        <circle cx="142" cy="112" r="4" fill="#fda4af" opacity="0.55" />
        <circle cx="178" cy="112" r="4" fill="#fda4af" opacity="0.55" />

        {/* Left arm reaching to laptop */}
        <path
          d="M 100 188 Q 78 200, 84 232 L 108 230 Q 112 210, 122 200 Z"
          fill={`url(#sweater-${variant})`}
        />
        {/* Left hand */}
        <circle cx="92" cy="232" r="10" fill="url(#skin)" />

        {/* Right arm reaching to laptop */}
        <path
          d="M 220 188 Q 242 200, 236 232 L 212 230 Q 208 210, 198 200 Z"
          fill={`url(#sweater-${variant})`}
        />
        {/* Right hand */}
        <circle cx="228" cy="232" r="10" fill="url(#skin)" />
      </g>

      {/* Laptop group with subtle tilt */}
      <Motion.g
        style={{ originX: 0.5, originY: 1, transformBox: "fill-box" }}
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Laptop base */}
        <path
          d="M 70 248 L 250 248 L 262 268 L 58 268 Z"
          fill="#cbd5e1"
        />
        <rect x="78" y="240" width="164" height="14" rx="3" fill="#e2e8f0" />

        {/* Laptop screen */}
        <rect x="84" y="200" width="152" height="44" rx="6" fill="#1e293b" />
        <rect x="90" y="206" width="140" height="32" rx="3" fill={`url(#screen-${variant})`} />

        {/* Mini chart bars on screen */}
        <rect x="100" y="222" width="6" height="10" rx="1.5" fill="#ffffff" opacity="0.85" />
        <rect x="112" y="216" width="6" height="16" rx="1.5" fill="#ffffff" opacity="0.85" />
        <rect x="124" y="226" width="6" height="6" rx="1.5" fill="#ffffff" opacity="0.85" />
        <rect x="136" y="218" width="6" height="14" rx="1.5" fill="#ffffff" opacity="0.85" />
        <rect x="148" y="212" width="6" height="20" rx="1.5" fill="#ffffff" opacity="0.85" />

        {/* Trend line */}
        <path
          d="M 165 224 Q 180 214, 195 218 Q 210 222, 220 210"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
      </Motion.g>

      {/* Tiny coin floating above laptop */}
      <Motion.g
        animate={{ y: [0, -10, 0], rotate: [0, 12, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: 0.5, originY: 0.5, transformBox: "fill-box" }}
      >
        <circle cx="240" cy="160" r="14" fill="#fbbf24" />
        <circle cx="240" cy="160" r="14" fill="none" stroke="#b45309" strokeWidth="2" />
        <text
          x="240"
          y="166"
          textAnchor="middle"
          fontSize="14"
          fontWeight="900"
          fill="#78350f"
          fontFamily="Inter, system-ui, sans-serif"
        >
          $
        </text>
      </Motion.g>
    </Motion.svg>
  );
}

export default HeroCharacter;
