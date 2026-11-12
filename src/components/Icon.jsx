export default function Icon({ name, size = 24 }) {
  const paths = {
    back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    grid: <><rect x="4" y="4" width="16" height="6" rx="1" /><rect x="4" y="14" width="16" height="6" rx="1" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    chart: <><path d="M4 20h16" /><path d="M7 20v-6M12 20V8M17 20v-9" /></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h4" /></>,
    flame: <path d="M12 2c1.2 3.4 4 4.8 4 8.5a4 4 0 0 1-8 0c0-1.4.5-2.5 1-3.2.2 1.6 1 2.2 1.6 2.3 0-3.2-1.1-5 1.4-7.6Z" />,
    sort: <><path d="M8 4v16m0 0-4-4m4 4 4-4M16 20V4m0 0-4 4m4-4 4 4" /></>,
    add: <><path d="M12 5v14M5 12h14" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    circle: <circle cx="12" cy="12" r="9" />,
    pin: <><path d="M16 3H8v6l-2 3v2h12v-2l-2-3z" /><path d="M12 14v7" /></>,
    archive: <><path d="M4 4h16v5H4z" /><path d="M6 9v11h12V9M10 13l2 2 2-2" /><path d="M12 11v4" /></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></>,
    restore: <><path d="M3 11a9 9 0 1 0 2.64-6.36L3 7" /><path d="M3 3v4h4" /></>,
    more: <><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3 3.8M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 3-.4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.9Z" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}
