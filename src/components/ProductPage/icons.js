// Stroke icons of the approved product page design (decorative: always aria-hidden).

const svg = (size, strokeWidth, children) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const ZoomIcon = ({ size = 20, minus = false }) =>
  svg(size, 1.3, (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d={minus ? 'M20 20l-4-4M8 11h6' : 'M20 20l-4-4M11 8v6M8 11h6'} />
    </>
  ));

export const GiftIcon = ({ size = 20 }) =>
  svg(size, 1.2, (
    <>
      <rect x="3" y="9" width="18" height="12" />
      <path d="M2 9h20M12 9v12M12 9c-2-4-6-5-6-2s4 2 6 2c2 0 6 1 6-2s-4-2-6 2" />
    </>
  ));

export const TruckIcon = ({ size = 20 }) =>
  svg(size, 1.2, (
    <>
      <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ));

export const ExchangeIcon = ({ size = 20 }) => svg(size, 1.2, <path d="M4 9h14l-3-3M20 15H6l3 3" />);

export const ArrowIcon = ({ size = 16, dir = 'down' }) => {
  const d = { up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', left: 'M15 6l-6 6 6 6', right: 'M9 6l6 6-6 6' }[dir];
  return svg(size, 1.4, <path d={d} />);
};
