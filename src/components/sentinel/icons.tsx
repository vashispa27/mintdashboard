/* Stroked icon set (1.7 weight, currentColor) ported from the design prototype. */
import type { ReactNode, CSSProperties } from "react";

interface IconProps {
  size?: number;
  fill?: string;
  vb?: number;
  sw?: number;
  style?: CSSProperties;
}

function Icon({
  d,
  size = 16,
  fill,
  vb = 24,
  sw = 1.7,
  children,
  style,
}: IconProps & { d?: string; children?: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      fill={fill || "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export const I = {
  grid: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
  ),
  activity: (p: IconProps) => <Icon {...p} d="M3 12h3.5l2.5 7 4-15 2.5 8H21" />,
  repo: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19a1 1 0 0 1 1 1v13.5" />
      <path d="M6 20h14" />
      <path d="M6 16h14M6 16a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2" />
    </Icon>
  ),
  star: (p: IconProps) => <Icon {...p} d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z" />,
  clock: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  ),
  user: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </Icon>
  ),
  search: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </Icon>
  ),
  refresh: (p: IconProps) => <Icon {...p} d="M20 11a8 8 0 1 0-.5 4M20 5v6h-6" />,
  back: (p: IconProps) => <Icon {...p} d="M15 5l-7 7 7 7" />,
  chevR: (p: IconProps) => <Icon {...p} d="M9 5l7 7-7 7" />,
  chevD: (p: IconProps) => <Icon {...p} d="M5 9l7 7 7-7" />,
  cpu: (p: IconProps) => (
    <Icon {...p}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <path d="M9.5 1.8v3M14.5 1.8v3M9.5 19.2v3M14.5 19.2v3M1.8 9.5h3M1.8 14.5h3M19.2 9.5h3M19.2 14.5h3" />
    </Icon>
  ),
  coin: (p: IconProps) => (
    <Icon {...p}>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" />
      <path d="M5 6.5v11c0 1.7 3.1 3 7 3s7-1.3 7-3v-11M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </Icon>
  ),
  wrench: (p: IconProps) => <Icon {...p} d="M14.7 6.3a4 4 0 0 0-5.4 5.2l-5 5a1.8 1.8 0 0 0 2.5 2.5l5-5a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.3-2.3z" />,
  folder: (p: IconProps) => <Icon {...p} d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.2h8a1.5 1.5 0 0 1 1.5 1.5v7.8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" />,
  folderOpen: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.2h8a1.5 1.5 0 0 1 1.5 1.5" />
      <path d="M3.2 10.5h17.3l-1.7 6.6A1.6 1.6 0 0 1 17.3 18H5.1a1.6 1.6 0 0 1-1.6-1.3z" />
    </Icon>
  ),
  file: (p: IconProps) => (
    <Icon {...p}>
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M13 3v6h6" />
    </Icon>
  ),
  image: (p: IconProps) => (
    <Icon {...p}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.6" />
      <path d="M5 17l4.5-4 3 2.5L16 11l3 3.5" />
    </Icon>
  ),
  code: (p: IconProps) => <Icon {...p} d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  fileCode: (p: IconProps) => (
    <Icon {...p}>
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
      <path d="M13 3v6h6" />
      <path d="M10 12.5l-1.5 1.5L10 15.5M14 12.5l1.5 1.5L14 15.5" />
    </Icon>
  ),
  upload: (p: IconProps) => (
    <Icon {...p}>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </Icon>
  ),
  lock: (p: IconProps) => (
    <Icon {...p}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  ),
  terminal: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7 9l3 3-3 3M13 15h4" />
    </Icon>
  ),
  list: (p: IconProps) => <Icon {...p} d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  sun: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  ),
  moon: (p: IconProps) => <Icon {...p} d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  stop: (p: IconProps) => (
    <Icon {...p}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </Icon>
  ),
  down: (p: IconProps) => <Icon {...p} d="M12 4v12M6 11l6 6 6-6" />,
  copy: (p: IconProps) => (
    <Icon {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </Icon>
  ),
  dot: (p: IconProps) => (
    <Icon {...p} fill="currentColor">
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  filter: (p: IconProps) => <Icon {...p} d="M3 5h18M6 12h12M10 19h4" />,
  ext: (p: IconProps) => (
    <Icon {...p}>
      <path d="M14 5h5v5M19 5l-7 7" />
      <path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
    </Icon>
  ),
};
