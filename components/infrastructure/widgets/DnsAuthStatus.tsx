'use client';

import { Shield, Check, X, AlertTriangle } from 'lucide-react';
import type { DnsAuthStatus } from '@/lib/types/infrastructure';

interface DnsAuthStatusProps {
  data: DnsAuthStatus;
}

export function DnsAuthStatusWidget({ data }: DnsAuthStatusProps) {
  const authRecords = [
    { name: 'SPF', configured: data.spf_configured, total: data.total_domains },
    { name: 'DKIM', configured: data.dkim_configured, total: data.total_domains },
    { name: 'DMARC', configured: data.dmarc_configured, total: data.total_domains },
    { name: 'MX', configured: data.mx_configured, total: data.total_domains },
  ];

  const allPassing = data.fully_authenticated === data.total_domains;
  const hasMissing = data.domains_missing_auth.length > 0;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Shield className="h-4 w-4 text-selery-cyan" />
          DNS Authentication
        </h3>
        {allPassing ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
            <Check className="h-3 w-3" />
            All Pass
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-500">
            <AlertTriangle className="h-3 w-3" />
            Issues
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {authRecords.map((record) => {
          const isPassing = record.configured === record.total;
          return (
            <div
              key={record.name}
              className={`flex items-center gap-2 p-2 rounded-lg bg-muted/50 ${
                isPassing ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-red-500'
              }`}
            >
              {isPassing ? (
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <span className="font-medium text-sm">{record.name}</span>
              <span className="text-muted-foreground text-sm ml-auto">
                {record.configured}/{record.total}
              </span>
            </div>
          );
        })}
      </div>

      {hasMissing && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-500 font-medium mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Domains Missing Authentication
          </p>
          <div className="space-y-1.5">
            {data.domains_missing_auth.slice(0, 3).map((domain) => (
              <div key={domain.domain} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[120px]">
                  {domain.domain}
                </span>
                <span className="text-amber-500">
                  Missing: {domain.missing.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fully authenticated</span>
          <span className="font-semibold text-green-500">
            {data.fully_authenticated}/{data.total_domains}
          </span>
        </div>
      </div>
    </div>
  );
}
