// Stroke icons of the approved category design (decorative: always aria-hidden).

export const BagIcon = ({ size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" focusable="false">
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6a3 3 0 016 0v2" />
  </svg>
);

export const ChevronDown = ({ size = 10, up = false }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" focusable="false">
    <path d={up ? 'M1 7l4-4 4 4' : 'M1 3l4 4 4-4'} fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const FilterIcon = ({ width = 18, height = 14 }) => (
  <svg width={width} height={height} viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" focusable="false">
    <path d="M0 2h18M3 7h12M6 12h6" />
  </svg>
);

export const CloseIcon = ({ size = 16, strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true" focusable="false">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);
