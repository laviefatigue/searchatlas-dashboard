interface BrandLogoProps {
  /** Additional classes for the wrapper */
  className?: string;
  /** Show the client name wordmark beside the logo. Set false when the logo SVG already contains the name. */
  showName?: boolean;
  /** Size variant — controls height. Width is always auto so wide wordmark SVGs scale correctly. */
  size?: 'sm' | 'md' | 'lg';
}

const heights = {
  sm: 'h-7',
  md: 'h-8',
  lg: 'h-10',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function BrandLogo({ className = '', showName = true, size = 'md' }: BrandLogoProps) {
  const logoSrc = process.env.NEXT_PUBLIC_CLIENT_LOGO ?? '/client-logo.png';
  const clientName = process.env.NEXT_PUBLIC_CLIENT_NAME ?? process.env.NEXT_PUBLIC_DASHBOARD_TITLE ?? 'Dashboard';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt={clientName}
        className={`${heights[size]} w-auto object-contain flex-shrink-0`}
      />
      {showName && (
        <span className={`${textSizes[size]} font-semibold text-white tracking-wide`}>
          {clientName}
        </span>
      )}
    </div>
  );
}
