interface BrandLogoProps {
  /** Additional classes for the wrapper */
  className?: string;
  /** Show the client name wordmark beside the logo */
  showName?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
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
        className={`${sizes[size]} rounded-md object-contain flex-shrink-0`}
      />
      {showName && (
        <span className={`${textSizes[size]} font-semibold text-white tracking-wide`}>
          {clientName}
        </span>
      )}
    </div>
  );
}
