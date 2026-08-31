'use client';

interface HealthScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthScoreGauge({ score, label, size = 'lg' }: HealthScoreGaugeProps) {
  const sizes = {
    sm: { radius: 50, stroke: 6, fontSize: '1.5rem' },
    md: { radius: 65, stroke: 8, fontSize: '2rem' },
    lg: { radius: 80, stroke: 10, fontSize: '2.5rem' },
  };

  const { radius, stroke: strokeWidth, fontSize } = sizes[size];
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Color scheme adapted for light/dark mode
  const getStrokeColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // success green
    if (score >= 60) return '#3b82f6'; // info blue
    if (score >= 40) return '#f59e0b'; // warning amber
    return '#ef4444'; // danger red
  };

  const getGlowColor = (score: number) => {
    if (score >= 80) return 'rgba(34, 197, 94, 0.3)';
    if (score >= 60) return 'rgba(59, 130, 246, 0.3)';
    if (score >= 40) return 'rgba(245, 158, 11, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  };

  const getStatusText = (score: number) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Warning';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse"
          style={{ backgroundColor: getGlowColor(score) }}
        />

        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 relative"
        >
          {/* Track */}
          <circle
            stroke="currentColor"
            className="text-muted/30"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress */}
          <circle
            stroke={getStrokeColor(score)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold"
            style={{ color: getStrokeColor(score), fontSize }}
          >
            {Math.round(score)}
          </span>
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: getStrokeColor(score) }}
          >
            {getStatusText(score)}
          </span>
        </div>
      </div>
      {label && (
        <p className="text-sm text-muted-foreground mt-4">{label}</p>
      )}
    </div>
  );
}
