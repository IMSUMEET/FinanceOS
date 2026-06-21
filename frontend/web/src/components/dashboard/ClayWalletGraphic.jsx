import React from "react";
import { motion as Motion } from "framer-motion";

function ClayWalletGraphic({ size = 320, className = "" }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 320 320"
        width="100%"
        height="100%"
        className="w-full h-full block overflow-visible"
      >
        <defs>
          {/* Wallet Base Gradient */}
          <linearGradient id="wallet-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Wallet Front Flap - Soft Claymorphic Leather */}
          <radialGradient id="wallet-front" cx="45%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Gold Card Gradient */}
          <linearGradient id="card-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Emerald Card Gradient */}
          <linearGradient id="card-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Gold Coin Radial Highlight */}
          <radialGradient id="coin-gold" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffe082" />
            <stop offset="70%" stopColor="#ffb300" />
            <stop offset="100%" stopColor="#ff6f00" />
          </radialGradient>

          {/* Shadow filters for clay depth */}
          <filter id="clay-card-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="4"
              dy="10"
              stdDeviation="6"
              floodColor="#000000"
              floodOpacity="0.25"
            />
          </filter>

          <filter id="coin-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#000000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Soft Background Radial Glow */}
        <circle
          cx="160"
          cy="160"
          r="110"
          fill="url(#coin-gold)"
          opacity="0.06"
          filter="blur(8px)"
        />

        {/* --- Back Flap of Wallet --- */}
        <path
          d="M 60 140 C 60 120, 260 120, 260 140 L 260 210 C 260 225, 60 225, 60 210 Z"
          fill="url(#wallet-body)"
          filter="url(#clay-card-shadow)"
        />

        {/* --- Sticking out Credit Cards --- */}
        {/* Emerald Card */}
        <Motion.g
          animate={{ y: [0, -8, 0], rotate: [-8, -6, -8] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "100px", originY: "140px" }}
        >
          <rect
            x="80"
            y="95"
            width="100"
            height="64"
            rx="8"
            fill="url(#card-emerald)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            filter="url(#clay-card-shadow)"
          />
          {/* Card chip */}
          <rect x="94" y="110" width="16" height="12" rx="2" fill="#ffe082" opacity="0.8" />
          {/* Card stripes */}
          <rect x="94" y="130" width="40" height="4" rx="1" fill="#ffffff" opacity="0.25" />
          <rect x="94" y="138" width="60" height="4" rx="1" fill="#ffffff" opacity="0.2" />
        </Motion.g>

        {/* Gold Card */}
        <Motion.g
          animate={{ y: [0, -12, 0], rotate: [6, 8, 6] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          style={{ originX: "220px", originY: "145px" }}
        >
          <rect
            x="130"
            y="85"
            width="105"
            height="66"
            rx="8"
            fill="url(#card-gold)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            filter="url(#clay-card-shadow)"
          />
          {/* Card chip */}
          <rect x="144" y="100" width="16" height="12" rx="2" fill="#ffffff" opacity="0.9" />
          {/* Card branding logo shapes */}
          <circle cx="210" cy="132" r="8" fill="#ff6f00" opacity="0.85" />
          <circle cx="218" cy="132" r="8" fill="#ffe082" opacity="0.85" />
        </Motion.g>

        {/* --- Front Wallet Cover / Flap --- */}
        <path
          d="M 50 148 C 50 135, 270 135, 270 148 L 270 215 C 270 232, 50 232, 50 215 Z"
          fill="url(#wallet-front)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          filter="url(#clay-card-shadow)"
        />

        {/* Stitching Line detailing */}
        <path
          d="M 58 156 Q 160 146, 262 156"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="2"
          strokeDasharray="4,4"
          fill="none"
        />

        {/* Clasp / Buckle */}
        <g filter="url(#clay-card-shadow)">
          <path
            d="M 140 144 L 180 144 L 174 176 C 174 182, 146 182, 146 176 Z"
            fill="#0f172a"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1.5"
          />
          {/* Emerald metallic logo clasp button */}
          <circle cx="160" cy="166" r="8" fill="url(#card-emerald)" />
          <circle
            cx="160"
            cy="166"
            r="5"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1"
          />
        </g>

        {/* --- FLOATING COINS & SYMBOLS --- */}
        {/* Coin 1: Top Left */}
        <Motion.g
          animate={{ y: [0, -16, 0], x: [0, 4, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <g filter="url(#coin-shadow)">
            <circle cx="70" cy="70" r="16" fill="url(#coin-gold)" />
            <circle cx="70" cy="70" r="16" fill="none" stroke="#e65100" strokeWidth="1" />
            <circle
              cx="70"
              cy="70"
              r="12"
              fill="none"
              stroke="#fff8e1"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <text x="70" y="75" textAnchor="middle" fill="#5d4037" fontSize="15" fontWeight="bold">
              $
            </text>
          </g>
        </Motion.g>

        {/* Coin 2: Top Right */}
        <Motion.g
          animate={{ y: [0, -22, 0], x: [0, -6, 0], rotate: [0, -12, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <g filter="url(#coin-shadow)">
            <circle cx="230" cy="55" r="18" fill="url(#coin-gold)" />
            <circle cx="230" cy="55" r="18" fill="none" stroke="#e65100" strokeWidth="1" />
            <circle
              cx="230"
              cy="55"
              r="14"
              fill="none"
              stroke="#fff8e1"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <text x="230" y="61" textAnchor="middle" fill="#5d4037" fontSize="17" fontWeight="bold">
              $
            </text>
          </g>
        </Motion.g>

        {/* Coin 3: Mid Right */}
        <Motion.g
          animate={{ y: [0, -14, 0], x: [0, -3, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <g filter="url(#coin-shadow)">
            <circle cx="280" cy="150" r="13" fill="url(#coin-gold)" />
            <circle cx="280" cy="150" r="13" fill="none" stroke="#e65100" strokeWidth="1" />
            <circle
              cx="280"
              cy="150"
              r="9"
              fill="none"
              stroke="#fff8e1"
              strokeWidth="1"
              strokeDasharray="1.5,1.5"
            />
            <text
              x="280"
              y="154"
              textAnchor="middle"
              fill="#5d4037"
              fontSize="12"
              fontWeight="bold"
            >
              %
            </text>
          </g>
        </Motion.g>

        {/* Coin 4: Bottom Left */}
        <Motion.g
          animate={{ y: [0, -10, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 4.1, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <g filter="url(#coin-shadow)">
            <circle cx="50" cy="245" r="11" fill="url(#coin-gold)" />
            <circle cx="50" cy="245" r="11" fill="none" stroke="#e65100" strokeWidth="1" />
            <text x="50" y="249" textAnchor="middle" fill="#5d4037" fontSize="11" fontWeight="bold">
              +
            </text>
          </g>
        </Motion.g>

        {/* Sparkles */}
        <Motion.path
          d="M 120 40 L 122 46 L 128 48 L 122 50 L 120 56 L 118 50 L 112 48 L 118 46 Z"
          fill="#ffd54f"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <Motion.path
          d="M 280 90 L 281.5 94 L 286 95.5 L 281.5 97 L 280 101 L 278.5 97 L 274 95.5 L 278.5 94 Z"
          fill="#ffd54f"
          animate={{ scale: [1.2, 0.8, 1.2], opacity: [0.8, 0.5, 0.8] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>
    </div>
  );
}

export default ClayWalletGraphic;
