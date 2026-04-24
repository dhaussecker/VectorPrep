interface OQLogoProps {
  size?: number;
  className?: string;
}

const DARK = "#1B3A2A";
const MID = "#2D5A3A";
const ACCENT = "#4A7A56";
const RIVER = "#6BAE82";

export function OQLogo({ size = 32, className = "" }: OQLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Clip to inner circle of the Q ring */}
        <clipPath id="oq-scene">
          <circle cx="48" cy="46" r="31" />
        </clipPath>
      </defs>

      {/* Scene background */}
      <circle cx="48" cy="46" r="31" fill={MID} />

      {/* Mountains + winding river, clipped to inner circle */}
      <g clipPath="url(#oq-scene)">
        <polygon points="5,82 35,26 65,82" fill={DARK} />
        <polygon points="30,82 55,34 80,82" fill={ACCENT} />
        <path
          d="M 46 16 Q 37 35 45 51 Q 53 67 41 82"
          stroke={RIVER}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 46 16 Q 37 35 45 51 Q 53 67 41 82"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.25"
        />
      </g>

      {/* Sword: blade from upper-left to lower-right, crossguard, handle */}
      <line x1="31" y1="12" x2="58" y2="74" stroke={DARK} strokeWidth="5" strokeLinecap="round" />
      <line x1="25" y1="33" x2="49" y2="22" stroke={DARK} strokeWidth="4.5" strokeLinecap="round" />
      <line x1="57" y1="68" x2="62" y2="78" stroke={DARK} strokeWidth="7" strokeLinecap="round" />

      {/* Q ring: thick stroke circle with gap from 3 o'clock to ~5:30 (75°)
          r=37, circumference≈232.5, gap=75°≈48.4px, arc≈184.1px
          dashoffset=48.4 shifts start to the post-gap position (5:30 o'clock) */}
      <circle
        cx="48"
        cy="46"
        r="37"
        stroke={DARK}
        strokeWidth="12"
        strokeDasharray="184 48.4"
        strokeDashoffset="48.4"
      />

      {/* Q tail: extends from bottom of gap (outer 75° ≈ 59,87) toward lower-right */}
      <line x1="59" y1="87" x2="82" y2="97" stroke={DARK} strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

export function OQWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <OQLogo size={32} />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-black font-mono tracking-tight text-foreground">OnQuest</span>
        <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Exam Prep</span>
      </div>
    </div>
  );
}
