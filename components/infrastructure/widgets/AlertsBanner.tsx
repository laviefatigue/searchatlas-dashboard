'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Alert } from '@/lib/types/infrastructure';

interface AlertsBannerProps {
  alerts: Alert[];
  maxVisible?: number;
}

export function AlertsBanner({ alerts, maxVisible = 3 }: AlertsBannerProps) {
  if (alerts.length === 0) return null;

  const visibleAlerts = alerts.slice(0, maxVisible);
  const remainingCount = alerts.length - maxVisible;

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-gradient-to-r from-red-500/15 to-red-500/5',
          border: 'border-red-500/30',
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          dot: 'bg-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-500/15 to-amber-500/5',
          border: 'border-amber-500/30',
          icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
          dot: 'bg-amber-500',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-selery-cyan/15 to-selery-cyan/5',
          border: 'border-selery-cyan/30',
          icon: <Info className="h-4 w-4 text-selery-cyan" />,
          dot: 'bg-selery-cyan',
        };
    }
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert, index) => {
        const styles = getAlertStyles(alert.type);
        return (
          <div
            key={alert.id}
            className={`${styles.bg} ${styles.border} border rounded-xl px-4 py-3 flex items-center gap-3`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} />
            </div>
            <div className="flex-shrink-0">{styles.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {alert.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {alert.message}
              </p>
            </div>
            {alert.entity_name && (
              <span className="flex-shrink-0 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {alert.entity_name}
              </span>
            )}
          </div>
        );
      })}

      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground text-center py-1">
          +{remainingCount} more alert{remainingCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
