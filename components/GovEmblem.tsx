import React from "react";

interface GovEmblemProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Official-style Government of Haryana State Emblem SVG
 * Features:
 * - Double gold ceremonial rim with beaded ring
 * - Radiating Surya rays (Rising Sun of Haryana)
 * - Dharmachakra (Ashoka Wheel with 24 spokes)
 * - Flanking Golden Wheat Sheaves (कृषि एवं समृद्धि - Haryana agrarian crest)
 * - Lotus base with sacred river waters (Yamuna/Saraswati)
 * - Lion capital apex symbol
 */
export default function GovEmblem({
  size = 40,
  className = "",
  style = {},
}: GovEmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
      aria-label="हरियाणा सरकार राज्य चिन्ह"
    >
      <defs>
        {/* Outer Rim Gold Gradient */}
        <linearGradient id="emblemGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>

        {/* Center Navy Radial Gradient */}
        <radialGradient id="emblemNavyCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="65%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        {/* Sunbeam Glow */}
        <radialGradient id="sunGlow" cx="50%" cy="28%" r="45%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>

        {/* Chakra Glow */}
        <linearGradient id="chakraBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="emblemShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Outer Drop Shadow Disc */}
      <circle cx="60" cy="60" r="56" fill="url(#emblemGoldRim)" filter="url(#emblemShadow)" />

      {/* Decorative Beaded Outer Ring */}
      <circle
        cx="60"
        cy="60"
        r="53.5"
        stroke="#78350f"
        strokeWidth="1"
        strokeDasharray="2 3"
        fill="none"
        opacity="0.65"
      />

      {/* Inner Rim */}
      <circle cx="60" cy="60" r="51" fill="#0b1329" stroke="url(#emblemGoldRim)" strokeWidth="1.5" />

      {/* Core Navy Shield */}
      <circle cx="60" cy="60" r="49" fill="url(#emblemNavyCore)" />

      {/* Radiating Sun Rays (Rising Sun of Haryana) */}
      <path
        d="M60 20 L61.5 28 L60 27 L58.5 28 Z
           M68 22 L66 29.5 L65 28.5 L63.5 29.8 Z
           M52 22 L56.5 29.8 L55 28.5 L54 29.5 Z
           M75 26 L70 32.5 L69 31 L68 33 Z
           M45 26 L52 33 L51 31 L49.5 32.5 Z
           M81 32 L74 37 L73.5 35.5 L72 37.5 Z
           M39 32 L48 37.5 L46.5 35.5 L46 37 Z"
        fill="#fef08a"
        opacity="0.9"
      />
      <circle cx="60" cy="36" r="14" fill="url(#sunGlow)" />
      <circle cx="60" cy="36" r="7" fill="#fbbf24" stroke="#fef08a" strokeWidth="1" />

      {/* Left Golden Wheat Sheaf (कृषि प्रतीक) */}
      <g stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" fill="#eab308">
        <path d="M30 65 Q27 55 35 45" fill="none" />
        <ellipse cx="28" cy="46" rx="2.5" ry="5" transform="rotate(-30 28 46)" />
        <ellipse cx="32" cy="41" rx="2.5" ry="5.5" transform="rotate(-15 32 41)" />
        <ellipse cx="25" cy="53" rx="2.5" ry="5" transform="rotate(-40 25 53)" />
        <ellipse cx="29" cy="50" rx="2.5" ry="5" transform="rotate(-25 29 50)" />
        <ellipse cx="24" cy="61" rx="2.5" ry="4.5" transform="rotate(-50 24 61)" />
        <ellipse cx="28" cy="58" rx="2.5" ry="4.5" transform="rotate(-35 28 58)" />
        <ellipse cx="25" cy="69" rx="2.5" ry="4" transform="rotate(-60 25 69)" />
      </g>

      {/* Right Golden Wheat Sheaf (कृषि प्रतीक) */}
      <g stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" fill="#eab308">
        <path d="M90 65 Q93 55 85 45" fill="none" />
        <ellipse cx="92" cy="46" rx="2.5" ry="5" transform="rotate(30 92 46)" />
        <ellipse cx="88" cy="41" rx="2.5" ry="5.5" transform="rotate(15 88 41)" />
        <ellipse cx="95" cy="53" rx="2.5" ry="5" transform="rotate(40 95 53)" />
        <ellipse cx="91" cy="50" rx="2.5" ry="5" transform="rotate(25 91 50)" />
        <ellipse cx="96" cy="61" rx="2.5" ry="4.5" transform="rotate(50 96 61)" />
        <ellipse cx="92" cy="58" rx="2.5" ry="4.5" transform="rotate(35 92 58)" />
        <ellipse cx="95" cy="69" rx="2.5" ry="4" transform="rotate(60 95 69)" />
      </g>

      {/* Center Dharma Chakra (Ashoka Wheel with 24 Spokes) */}
      <g transform="translate(60, 64)">
        {/* Outer Blue Tire */}
        <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="url(#emblemGoldRim)" strokeWidth="1.8" />
        <circle cx="0" cy="0" r="14.5" stroke="#1d4ed8" strokeWidth="1.2" fill="none" />
        
        {/* Chakra Spokes (12 symmetric spoke lines = 24 radial points) */}
        <g stroke="#1e40af" strokeWidth="0.85">
          <line x1="0" y1="-14" x2="0" y2="14" />
          <line x1="-14" y1="0" x2="14" y2="0" />
          <line x1="-9.9" y1="-9.9" x2="9.9" y2="9.9" />
          <line x1="-9.9" y1="9.9" x2="9.9" y2="-9.9" />
          <line x1="-5.4" y1="-12.9" x2="5.4" y2="12.9" />
          <line x1="-12.9" y1="-5.4" x2="12.9" y2="5.4" />
          <line x1="-12.9" y1="5.4" x2="12.9" y2="-5.4" />
          <line x1="-5.4" y1="12.9" x2="5.4" y2="-12.9" />
          <line x1="-3.6" y1="-13.5" x2="3.6" y2="13.5" />
          <line x1="-13.5" y1="-3.6" x2="13.5" y2="3.6" />
          <line x1="-13.5" y1="3.6" x2="13.5" y2="-3.6" />
          <line x1="-3.6" y1="13.5" x2="3.6" y2="-13.5" />
        </g>

        {/* Chakra Inner Hub */}
        <circle cx="0" cy="0" r="4" fill="#1e3a8a" stroke="#ffffff" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="1.5" fill="#facc15" />
      </g>

      {/* Lotus Petal Pedestal Base */}
      <g fill="url(#emblemGoldRim)">
        <path d="M42 86 C48 83, 54 85, 60 88 C66 85, 72 83, 78 86 C74 90, 68 91, 60 91 C52 91, 46 90, 42 86 Z" />
      </g>

      {/* Sacred River Waters (Yamuna & Saraswati River waves) */}
      <path
        d="M38 93 Q49 90 60 93 T82 93
           M41 97 Q50 94 60 97 T79 97"
        stroke="#60a5fa"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />

      {/* Base Ribbon with Inscription */}
      <path
        d="M34 100 L44 98 L76 98 L86 100 L84 105 L76 103 L44 103 L36 105 Z"
        fill="url(#emblemGoldRim)"
        stroke="#78350f"
        strokeWidth="0.6"
      />
      {/* Decorative center star on ribbon */}
      <circle cx="60" cy="100.5" r="1.5" fill="#78350f" />
    </svg>
  );
}
