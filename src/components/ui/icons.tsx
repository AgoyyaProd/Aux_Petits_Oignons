import type { SVGProps } from "react";

/**
 * Icônes de l'interface : trait fin (1,75), coins arrondis, grille 24 px.
 * Décoratives par défaut (aria-hidden) : le texte voisin ou un aria-label porte le sens.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
  </svg>
);
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);
export const BasketIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 9.5h17l-1.6 9.1a2 2 0 0 1-2 1.7H7.1a2 2 0 0 1-2-1.7z" />
    <path d="m8 9.5 3-5.5M16 9.5 13 4M9.5 13.5v3M14.5 13.5v3" />
  </svg>
);
export const PantryIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="2.5" />
    <path d="M5 10h14M8.5 6.5v1M8.5 13.5v2" />
  </svg>
);
export const BookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" />
    <path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5" />
  </svg>
);
export const WalletIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
    <rect x="4" y="8" width="16.5" height="11.5" rx="2.5" />
    <path d="M16 13.75h1.5" />
  </svg>
);
export const TagIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);
export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);
export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.25" />
    <path d="M3 19.5a6 6 0 0 1 12 0M15.5 5.5a3.25 3.25 0 0 1 0 6.25M17.5 14.2A6 6 0 0 1 21 19.5" />
  </svg>
);
export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);
export const LeafIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 19c0-8 5.5-14 15-14 0 9.5-6 15-14 15" />
    <path d="M5 19 13 11" />
  </svg>
);
export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const MinusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
  </svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);
export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
  </svg>
);
export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);
export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
  </svg>
);
export const SwapIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4 3.5 7.5 7 11M3.5 7.5h13M17 13l3.5 3.5L17 20M20.5 16.5h-13" />
  </svg>
);
export const FridgeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M6 9.5h12M9 5.5v1.5M9 12.5v3" />
  </svg>
);
export const SnowIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5" />
  </svg>
);
export const JarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 3.5h8M7.5 6.5h9M7.5 6.5C6 7.5 5.5 9 5.5 11v7.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V11c0-2-.5-3.5-2-4.5" />
  </svg>
);
export const PotIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10.5h18M5 10.5v6.5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6.5M9 7.5c0-1.5 1-2.5 3-2.5s3 1 3 2.5" />
  </svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />
  </svg>
);
export const LogOutIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3M10 16.5 5.5 12 10 7.5M5.5 12h10" />
  </svg>
);
export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5M12 16v.5" />
  </svg>
);
export const GaugeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 16a8 8 0 1 1 16 0" />
    <path d="m12 16 3.5-5" />
    <path d="M4 16h2M18 16h2" />
  </svg>
);
export const MoreIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="5.5" r="1.1" fill="currentColor" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    <circle cx="12" cy="18.5" r="1.1" fill="currentColor" />
  </svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
/** Flamme : énergie (kcal). */
export const FlameIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3c.5 3-1.5 4.5-3 6.5S7 13 7 15a5 5 0 0 0 10 0c0-2.5-1.5-4.5-2.5-5.5 0 1.5-.75 2.5-1.75 3C13.5 10 13.5 6 12 3z" />
  </svg>
);
