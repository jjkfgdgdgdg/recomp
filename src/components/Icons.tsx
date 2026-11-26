import type { JSX } from 'preact';

type P = { size?: number };

const svg = (size: number, children: JSX.Element | JSX.Element[]) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IconCheck = ({ size = 20 }: P) => svg(size, <path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="3" />);
export const IconToday = ({ size = 22 }: P) =>
  svg(size, [<rect x="3.5" y="4.5" width="17" height="16" rx="3" />, <path d="M3.5 9.5h17M8 2.5v4M16 2.5v4M8.5 15l2.5 2.5 4.5-4.5" />]);
export const IconList = ({ size = 22 }: P) =>
  svg(size, [<path d="M9 6h11M9 12h11M9 18h11" />, <circle cx="4.5" cy="6" r="1.2" />, <circle cx="4.5" cy="12" r="1.2" />, <circle cx="4.5" cy="18" r="1.2" />]);
export const IconTimer = ({ size = 22 }: P) => svg(size, [<circle cx="12" cy="13.5" r="7.5" />, <path d="M12 9.5v4l2.5 2M9.5 2.5h5M19 6l1.5-1.5" />]);
export const IconGift = ({ size = 22 }: P) =>
  svg(size, [
    <rect x="3.5" y="8.5" width="17" height="4" rx="1" />,
    <path d="M5 12.5v8h14v-8M12 8.5v12M12 8.5C10.5 5 7 4 6.5 6s2.5 2.5 5.5 2.5zM12 8.5c1.5-3.5 5-4.5 5.5-2.5s-2.5 2.5-5.5 2.5z" />,
  ]);
export const IconChart = ({ size = 22 }: P) => svg(size, <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
export const IconGear = ({ size = 22 }: P) =>
  svg(size, [
    <circle cx="12" cy="12" r="3" />,
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />,
  ]);
export const IconPlus = ({ size = 20 }: P) => svg(size, <path d="M12 5v14M5 12h14" />);
export const IconLeft = ({ size = 22 }: P) => svg(size, <path d="M15 5l-7 7 7 7" />);
export const IconRight = ({ size = 22 }: P) => svg(size, <path d="M9 5l7 7-7 7" />);
export const IconUp = ({ size = 18 }: P) => svg(size, <path d="M6 15l6-6 6 6" />);
export const IconDown = ({ size = 18 }: P) => svg(size, <path d="M6 9l6 6 6-6" />);
export const IconEdit = ({ size = 18 }: P) => svg(size, <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />);
export const IconTrash = ({ size = 18 }: P) => svg(size, <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const IconClose = ({ size = 22 }: P) => svg(size, <path d="M6 6l12 12M18 6L6 18" />);
export const IconCopy = ({ size = 18 }: P) => svg(size, [<rect x="8" y="8" width="12" height="12" rx="2" />, <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />]);
export const IconPlay = ({ size = 20 }: P) => svg(size, <path d="M7 4.5v15l12-7.5z" fill="currentColor" />);
export const IconPause = ({ size = 20 }: P) => svg(size, <path d="M8 5v14M16 5v14" stroke-width="3" />);
export const IconStop = ({ size = 20 }: P) => svg(size, <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />);

/** Petit ticket d'arcade, utilisé comme symbole de la monnaie */
export const IconTicket = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5V9a3 3 0 0 0 0 6v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V15a3 3 0 0 0 0-6V6.5zM15 7v2h1.5V7H15zm0 4v2h1.5v-2H15zm0 4v2h1.5v-2H15z"
    />
  </svg>
);
