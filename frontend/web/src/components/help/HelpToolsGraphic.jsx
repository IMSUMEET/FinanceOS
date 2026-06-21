import { motion as Motion } from "framer-motion";

function HelpToolsGraphic({ size = 280, className = "" }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative mx-auto flex items-center justify-center ${className}`}
      role="img"
      aria-label="Support tools illustration"
    >
      <svg viewBox="0 0 320 320" width="100%" height="100%" className="block overflow-hidden">
        <defs>
          <linearGradient id="help-toolbox-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="help-toolbox-lid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="help-wrench-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="help-gear-teal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <linearGradient id="help-mail-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="help-bulb-amber" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="help-tool-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="8" stdDeviation="5" floodColor="#000" floodOpacity="0.28" />
          </filter>
        </defs>

        <circle cx="160" cy="165" r="108" fill="#14b8a6" opacity="0.07" />

        {/* Toolbox base */}
        <g filter="url(#help-tool-shadow)">
          <rect x="96" y="172" width="128" height="68" rx="14" fill="url(#help-toolbox-body)" />
          <rect x="104" y="180" width="112" height="8" rx="4" fill="#64748b" opacity="0.45" />
          <rect
            x="148"
            y="192"
            width="24"
            height="32"
            rx="6"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="2"
          />
        </g>

        {/* Toolbox lid */}
        <Motion.g
          animate={{ rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          transform="rotate(0 160 172)"
          style={{ transformOrigin: "160px 172px" }}
          filter="url(#help-tool-shadow)"
        >
          <path
            d="M 86 152 Q 86 134, 104 130 L 216 130 Q 234 134, 234 152 L 234 174 L 86 174 Z"
            fill="url(#help-toolbox-lid)"
          />
          <rect x="148" y="124" width="24" height="12" rx="6" fill="#64748b" />
        </Motion.g>

        {/* Wrench — left */}
        <Motion.g
          animate={{ y: [0, -6, 0], rotate: [-6, 2, -6] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "72px 118px" }}
          filter="url(#help-tool-shadow)"
        >
          <path
            d="M 58 98 L 72 112 L 64 120 L 76 132 L 86 122 L 94 130 L 82 142 L 50 110 Z"
            fill="url(#help-wrench-metal)"
          />
          <circle cx="54" cy="102" r="9" fill="none" stroke="#94a3b8" strokeWidth="3.5" />
        </Motion.g>

        {/* Gear — small, tucked near toolbox (no full spin) */}
        <Motion.g
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "214px 148px" }}
          filter="url(#help-tool-shadow)"
        >
          <circle cx="214" cy="148" r="16" fill="url(#help-gear-teal)" />
          <circle cx="214" cy="148" r="6" fill="#0f172a" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect
              key={deg}
              x="211"
              y="128"
              width="6"
              height="9"
              rx="1.5"
              fill="#5eead4"
              transform={`rotate(${deg} 214 148)`}
            />
          ))}
        </Motion.g>

        {/* Envelope — right */}
        <Motion.g
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          filter="url(#help-tool-shadow)"
        >
          <rect x="208" y="188" width="48" height="34" rx="8" fill="url(#help-mail-blue)" />
          <path
            d="M 208 194 L 232 212 L 256 194"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </Motion.g>

        {/* Lightbulb */}
        <Motion.g
          animate={{ y: [0, -6, 0], opacity: [0.88, 1, 0.88] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          filter="url(#help-tool-shadow)"
        >
          <circle cx="88" cy="208" r="16" fill="url(#help-bulb-amber)" />
          <path
            d="M 80 204 Q 88 197, 96 204"
            fill="none"
            stroke="#fff7ed"
            strokeWidth="2"
            opacity="0.7"
          />
          <rect x="80" y="220" width="16" height="9" rx="3" fill="#94a3b8" />
        </Motion.g>

        {/* Screwdriver */}
        <Motion.g
          animate={{ y: [0, -7, 0], rotate: [8, -4, 8] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          style={{ transformOrigin: "118px 88px" }}
          filter="url(#help-tool-shadow)"
        >
          <rect x="112" y="72" width="9" height="42" rx="3" fill="#f97316" />
          <rect x="110" y="110" width="13" height="24" rx="2" fill="url(#help-wrench-metal)" />
          <polygon points="116,134 110,150 122,150" fill="#cbd5e1" />
        </Motion.g>

        <Motion.path
          d="M 160 78 L 162 84 L 168 86 L 162 88 L 160 94 L 158 88 L 152 86 L 158 84 Z"
          fill="#fcd34d"
          animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

export default HelpToolsGraphic;
