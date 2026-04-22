/**
 * NetTapu Logo — Professional inline SVG.
 * Inspired by the user's reference: boxed frame, "NET" in olive green, "TAPU" in white/charcoal.
 *
 * Usage:
 *   <NetTapuLogo variant="light" />  // light background (header, white bg)
 *   <NetTapuLogo variant="dark" />   // dark background (footer, dark panels)
 *   <NetTapuLogo variant="mono-light" />  // all-white for solid olive panel
 */

type Variant = 'light' | 'dark' | 'mono-light' | 'mono-dark';

interface NetTapuLogoProps {
  variant?: Variant;
  className?: string;
  width?: number;
  height?: number;
}

export function NetTapuLogo({
  variant = 'light',
  className = '',
  width = 148,
  height = 36,
}: NetTapuLogoProps) {
  // Colors per variant
  const c = (() => {
    switch (variant) {
      case 'dark':
        return { net: '#aebb66', tapu: '#ffffff', frame: '#ffffff' };
      case 'mono-light':
        return { net: '#ffffff', tapu: '#ffffff', frame: '#ffffff' };
      case 'mono-dark':
        return { net: '#1f1f1c', tapu: '#1f1f1c', frame: '#1f1f1c' };
      case 'light':
      default:
        return { net: '#515d2b', tapu: '#1f1f1c', frame: '#1f1f1c' };
    }
  })();

  return (
    <svg
      viewBox="0 0 148 36"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="NetTapu"
    >
      {/* Frame/box around "NET" — references user's logo */}
      <rect
        x="0.75"
        y="0.75"
        width="64"
        height="34.5"
        rx="2"
        fill="none"
        stroke={c.frame}
        strokeWidth="1.5"
      />
      {/* "NET" wordmark */}
      <text
        x="6"
        y="26.5"
        fontFamily="Manrope, Inter, sans-serif"
        fontWeight="900"
        fontSize="22"
        letterSpacing="-0.01em"
        fill={c.net}
      >
        NET
      </text>
      {/* "TAPU" wordmark */}
      <text
        x="72"
        y="26.5"
        fontFamily="Manrope, Inter, sans-serif"
        fontWeight="900"
        fontSize="22"
        letterSpacing="-0.01em"
        fill={c.tapu}
      >
        TAPU
      </text>
    </svg>
  );
}

/* Compact square mark — for favicons, mobile, tight spaces */
export function NetTapuMark({
  variant = 'light',
  size = 36,
  className = '',
}: {
  variant?: Variant;
  size?: number;
  className?: string;
}) {
  const c = (() => {
    switch (variant) {
      case 'dark':       return { bg: '#2c2c28', net: '#aebb66' };
      case 'mono-light': return { bg: 'transparent', net: '#ffffff' };
      case 'mono-dark':  return { bg: 'transparent', net: '#1f1f1c' };
      case 'light':
      default:           return { bg: '#515d2b', net: '#ffffff' };
    }
  })();

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="NetTapu"
    >
      <rect width="40" height="40" rx="8" fill={c.bg} />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Manrope, Inter, sans-serif"
        fontWeight="900"
        fontSize="16"
        letterSpacing="-0.02em"
        fill={c.net}
      >
        NT
      </text>
    </svg>
  );
}
