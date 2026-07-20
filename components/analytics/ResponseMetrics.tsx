'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  Timer,
  Gauge,
  CalendarClock,
  MessageSquare,
  ChevronDown,
  Zap,
  Inbox,
} from 'lucide-react';

// ── Types (mirror /api/analytics/responses) ──────────────────────────
interface ThreadResponse {
  at: string;
  text: string;
}
interface ResponseThread {
  replyId: number;
  name: string;
  email: string;
  campaign: string;
  interested: boolean;
  inboundAt: string;
  inboundText: string;
  responses: ThreadResponse[];
  responded: boolean;
  firstTouchMinutes: number | null;
  resolutionMinutes: number | null;
}
interface Clocks {
  firstTouchInterestedMedianMinutes: number | null;
  firstTouchAllMedianMinutes: number | null;
  avgResolutionMinutes: number | null;
  avgTimeToBookMinutes: number | null;
  totalInbound: number;
  respondedCount: number;
  interestedResponded: number;
  responseRate: number;
  interestedWithinFirstTouchSLA: number;
  firstTouchTargetMinutes: number;
  resolutionTargetMinutes: number;
}
interface ResponsesPayload {
  clocks: Clocks | null;
  threads: ResponseThread[];
  meta: { timeToBookAvailable?: boolean; source?: string };
}

// ── Helpers ───────────────────────────────────────────────────────────
function fmtDuration(mins: number | null): string {
  if (mins == null) return '—';
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  return h ? `${d}d ${h}h` : `${d}d`;
}

// Colour a duration against an SLA target (green within target, amber within 2×, red beyond).
function slaColor(mins: number | null, targetMins: number): string {
  if (mins == null) return 'text-muted-foreground';
  if (mins <= targetMins) return 'text-brand-green';
  if (mins <= targetMins * 2) return 'text-warning';
  return 'text-destructive';
}

function fmtWhen(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ── Clock tile ────────────────────────────────────────────────────────
function ClockTile({
  icon: Icon,
  label,
  value,
  colorClass,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  colorClass?: string;
  sub?: string;
}) {
  return (
    <Card className="p-5 flex flex-col gap-2 bg-card border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-brand-cyan" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-4xl font-bold tabular-nums ${colorClass || 'text-foreground'}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

// ── Thread row ────────────────────────────────────────────────────────
function ThreadRow({ t }: { t: ResponseThread }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{t.name}</span>
            {t.interested && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-green/20 text-brand-green font-semibold">
                Interested
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {t.campaign} · {fmtWhen(t.inboundAt)}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className={`text-sm font-semibold ${slaColor(t.firstTouchMinutes, 12 * 60)}`}>
              {t.responded ? fmtDuration(t.firstTouchMinutes) : 'No reply yet'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">First touch</div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Inbound */}
          <div className="rounded-md bg-secondary/60 p-3">
            <div className="text-[11px] text-muted-foreground mb-1 flex items-center gap-1">
              <Inbox className="h-3 w-3" /> {t.name} wrote · {fmtWhen(t.inboundAt)}
            </div>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap">{t.inboundText || '—'}</div>
          </div>
          {/* Team responses */}
          {t.responses.length === 0 ? (
            <div className="text-xs text-muted-foreground italic px-1">No team response captured in this thread.</div>
          ) : (
            t.responses.map((r, i) => (
              <div key={i} className="rounded-md bg-brand-purple/10 border-l-2 border-brand-purple p-3 ml-4">
                <div className="text-[11px] text-brand-cyan mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Team replied · {fmtWhen(r.at)}
                </div>
                <div className="text-sm text-foreground/90 whitespace-pre-wrap">{r.text || '—'}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export function ResponseMetrics() {
  const [data, setData] = useState<ResponsesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/analytics/responses');
        const json = (await res.json()) as ResponsesPayload;
        if (alive) setData(json);
      } catch {
        if (alive) setData({ clocks: null, threads: [], meta: {} });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const c = data?.clocks;
  const threads = data?.threads ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-purple" /> Response Performance
          </h2>
          <p className="text-sm text-muted-foreground">
            How fast we respond to people who write in — target <span className="text-brand-green font-medium">12h first touch</span>,{' '}
            <span className="text-brand-green font-medium">24h to resolution</span> (1224 model).
          </p>
        </div>
      </div>

      {/* Clocks */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ClockTile
            icon={Timer}
            label="Med. First Touch · Interested"
            value={fmtDuration(c?.firstTouchInterestedMedianMinutes ?? null)}
            colorClass={slaColor(c?.firstTouchInterestedMedianMinutes ?? null, 12 * 60)}
            sub={c && c.interestedResponded > 0 ? `median across ${c.interestedResponded} interested` : 'no interested responses yet'}
          />
          <ClockTile
            icon={Gauge}
            label="Med. First Touch · All"
            value={fmtDuration(c?.firstTouchAllMedianMinutes ?? null)}
            colorClass={slaColor(c?.firstTouchAllMedianMinutes ?? null, 12 * 60)}
            sub="all answered threads"
          />
          <ClockTile
            icon={Clock}
            label="Avg Time to Resolution"
            value={fmtDuration(c?.avgResolutionMinutes ?? null)}
            colorClass={slaColor(c?.avgResolutionMinutes ?? null, 24 * 60)}
            sub="last team reply in thread"
          />
          <ClockTile
            icon={CalendarClock}
            label="Avg Time to Book"
            value="—"
            sub="needs a booking source (Day.AI)"
          />
        </div>
      )}

      {/* Secondary counters */}
      {!loading && c && c.totalInbound > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="text-foreground font-semibold">{c.respondedCount}</span>/{c.totalInbound} inbound answered
          </span>
          <span>
            Response rate <span className="text-brand-cyan font-semibold">{c.responseRate}%</span>
          </span>
          <span>
            <span className="text-brand-green font-semibold">{c.interestedWithinFirstTouchSLA}</span> interested within 12h SLA
          </span>
        </div>
      )}

      {/* Response feed */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <Card className="p-10 text-center bg-card border-border border-dashed">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-medium">No responses yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Response chains and timing metrics populate automatically as your team replies to inbound messages.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <ThreadRow key={t.replyId} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}
