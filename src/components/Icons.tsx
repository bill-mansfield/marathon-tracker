interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function BuildWeeksLogo({ iconSize = 16, onClick }: { iconSize?: number; onClick?: () => void }) {
  const fontSize = Math.round(iconSize * 0.875);
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        cursor: onClick ? "pointer" : "default",
        textDecoration: "none",
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" style={{ display: "block", flexShrink: 0 }}>
        <rect width="32" height="32" rx="7" fill="#059669"/>
        <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22" cy="6.5" r="2.6" fill="white" stroke="none"/>
          <line x1="20.5" y1="9.5" x2="16.5" y2="17" strokeWidth="2.4"/>
          <polyline points="19,12.5 14.5,9.5 13,11.5" strokeWidth="2"/>
          <line x1="19" y1="12.5" x2="23.5" y2="15.5" strokeWidth="2"/>
          <polyline points="16.5,17 12,21.5 14,27" strokeWidth="2.2"/>
          <polyline points="16.5,17 21.5,21.5 25,25.5" strokeWidth="2.2"/>
        </g>
      </svg>
      <span style={{ fontSize: `${fontSize}px`, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
        BuildWeeks
      </span>
    </span>
  );
}

export function CheckIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CheckboxIcon({ checked, size = 20 }: { checked: boolean; size?: number }) {
  if (checked) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#059669" stroke="none">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <polyline points="7 12 10.5 16 17 8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" stroke="#b8ad9e" strokeWidth="1.5" />
    </svg>
  );
}

export function StarIcon({ filled, size = 14, color = "#d97706" }: { filled: boolean; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={filled ? color : "#b8ad9e"} strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function NoteIcon({ hasNote, size = 14 }: { hasNote: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={hasNote ? "#059669" : "none"} stroke={hasNote ? "#059669" : "#b8ad9e"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      {hasNote && (
        <>
          <line x1="8" y1="8" x2="16" y2="8" stroke="white" strokeWidth="1.5" />
          <line x1="8" y1="12" x2="13" y2="12" stroke="white" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

export function StravaIcon({ linked, size = 14 }: { linked: boolean; size?: number }) {
  // Official Strava logo path from Simple Icons (CC0 licence)
  const color = linked ? "#fc4c02" : "#b8ad9e";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

export function SunIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function MoonIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export function PencilIcon({ size = 10 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}
