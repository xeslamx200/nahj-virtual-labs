import type { SVGProps } from 'react';

const paths: Record<string, string> = {
  play: 'M7 5.5v13l11-6.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  step: 'M6 5.5v13l8.5-6.5zM16 5h2.5v14H16z',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.6h3.6',
  record: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  book: 'M5 4.5h5.5a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H5zM19 4.5h-5.5a2 2 0 0 0-1 .3M19 4.5V18h-5.5a2 2 0 0 0-1 .3',
  bolt: 'M13 3L5.5 13.5H11L10 21l7.5-10.5H12z',
  motion: 'M3 16h3M3 12h5M3 8h3M10 18.5a1.5 1.5 0 1 0 0-.01M18 18.5a1.5 1.5 0 1 0 0-.01M8 15V9.5A1.5 1.5 0 0 1 9.5 8H16l3 4v3',
  flame: 'M12 3s5 4.5 5 9.5a5 5 0 0 1-10 0c0-2.5 1.5-4 1.5-4s.5 2.5 2.5 3c0-3.5 1-6 1-8.5z',
  present: 'M3.5 4.5h17v11h-17zM12 15.5V20M8 20h8',
  chevron: 'M9 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  info: 'M12 8h.01M11 11h1v6h1',
  warn: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  print: 'M7 9V4h10v5M7 17H5v-6h14v6h-2M8 14h8v6H8z',
  download: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14',
  flip: 'M7 7h10l-3-3M17 17H7l3 3',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 12h17M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z',
  target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1z',
  lightbulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z',
  send: 'M4 12l16-8-6 16-2.5-6.5z',
  close: 'M6 6l12 12M18 6L6 18',
  hand: 'M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1a5 5 0 0 1-4.3-2.4L4 14.5a1.5 1.5 0 0 1 2.5-1.6L8 15',
  layers: 'M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  flask: 'M9.5 3.5h5M10.5 3.5v5.2L5.2 18a1.7 1.7 0 0 0 1.5 2.5h10.6a1.7 1.7 0 0 0 1.5-2.5l-5.3-9.3V3.5M7.6 14h8.8',
  atom: 'M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 3.5c4.7 0 8.5 3.8 8.5 8.5s-3.8 8.5-8.5 8.5S3.5 16.7 3.5 12 7.3 3.5 12 3.5zM12 7.5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5-4.5-2-4.5-4.5 2-4.5 4.5-4.5z',
  scale: 'M12 4v15M7 19.5h10M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0zM12 4a1 1 0 1 0 0 .01',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2',
};

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const filled = name === 'play' || name === 'pause' || name === 'step' || name === 'record';
  return (
    <svg
      viewBox="0 0 24 24"
      className={`icon ${props.className ?? ''}`}
      aria-hidden="true"
      focusable="false"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
