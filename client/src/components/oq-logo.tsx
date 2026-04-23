interface OQLogo {
  size?: number;
  className?: string;
}

export function OQLogo({ size = 32, className = "" }: OQLogo) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Yellow background rounded square */}
      <rect width="40" height="40" rx="10" fill="#FFD400" />

      {/* Sword / quest mark */}
      {/* Blade */}
      <line x1="20" y1="6" x2="20" y2="28" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" />
      {/* Crossguard */}
      <line x1="13" y1="17" x2="27" y2="17" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" />
      {/* Grip */}
      <rect x="18" y="28" width="4" height="6" rx="2" fill="#0F0F0F" />
      {/* Diamond pommel */}
      <rect x="17.5" y="33" width="5" height="5" rx="1" fill="#0F0F0F" transform="rotate(45 20 35.5)" />
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
