'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { PageContainer } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  AnalyticsReport,
  AnalyzedReply,
  ReplySentiment,
  DemographicDistribution,
  FastAnalytics,
  SenderAnalytics,
  CampaignComparisonItem,
  SequenceStepPerformance,
  DomainStats,
  CopyAnalysis,
} from '@/lib/types/emailbison';
import { exportPageToPDF } from '@/lib/export-pdf';
import { exportToCSV } from '@/lib/export-csv';
import {
  Brain,
  Users,
  MessageSquare,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Minus,
  BarChart3,
  Building2,
  Briefcase,
  AlertTriangle,
  Sparkles,
  Filter,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  Globe,
  Zap,
  Target,
  ArrowRight,
  Lightbulb,
  TrendingDown,
  Award,
  PieChart,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS (Unchanged from original)
// ══════════════════════════════════════════════════════════════════════════════

const toTitleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());

function SentimentBadge({ sentiment }: { sentiment: ReplySentiment }) {
  const config = {
    positive: { label: 'Positive', bg: 'bg-selery-gold/10', text: 'text-amber-700', icon: ThumbsUp },
    negative: { label: 'Negative', bg: 'bg-red-100', text: 'text-red-700', icon: ThumbsDown },
    neutral: { label: 'Neutral', bg: 'bg-gray-100', text: 'text-gray-600', icon: Minus },
  }[sentiment];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const colors: Record<string, string> = {
    'interested': 'bg-selery-gold/15 text-amber-700',
    'not-interested': 'bg-red-100 text-red-700',
    'needs-info': 'bg-selery-cyan/15 text-cyan-700',
    'referral': 'bg-selery-navy/10 text-selery-navy',
    'out-of-office': 'bg-gray-100 text-gray-600',
    'unsubscribe': 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[intent] || colors['needs-info']}`}>
      {intent.replace(/-/g, ' ')}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXECUTIVE SUMMARY BAR (New - Top hero metrics)
// ══════════════════════════════════════════════════════════════════════════════

function ExecutiveSummaryBar({
  funnel,
  activeCampaigns,
  onExportPDF,
  onExportCSV,
  exporting,
}: {
  funnel: FastAnalytics['funnel'];
  activeCampaigns: number;
  onExportPDF: () => void;
  onExportCSV: () => void;
  exporting: boolean;
}) {
  const replyRate = funnel.contacted > 0 ? ((funnel.replied / funnel.contacted) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        {/* Hero Metrics */}
        <div className="flex items-center gap-8">
          {/* Interested - Gold highlight */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-selery-gold/15 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-selery-gold" />
            </div>
            <div>
              <p className="text-3xl font-bold text-selery-navy">{funnel.interested}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Interested</p>
            </div>
          </div>

          <div className="w-px h-10 bg-gray-200" />

          {/* Reply Rate */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-selery-cyan/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-selery-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold text-selery-navy">{replyRate}%</p>
              <p className="text-xs text-gray-500">Reply Rate</p>
            </div>
          </div>

          <div className="w-px h-10 bg-gray-200" />

          {/* Active Campaigns */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-selery-navy">{activeCampaigns}</p>
              <p className="text-xs text-gray-500">Active Campaigns</p>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={onExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-selery-navy hover:bg-selery-navy/90 rounded-lg transition-colors"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AI INSIGHTS CARD (New - Actionable recommendations)
// ══════════════════════════════════════════════════════════════════════════════

function AIInsightsCard({
  steps,
  funnel,
  copyData,
}: {
  steps: SequenceStepPerformance[];
  funnel: FastAnalytics['funnel'];
  copyData: CopyAnalysis | null;
}) {
  // Generate insights from existing data
  const insights = useMemo(() => {
    const items: { icon: typeof Lightbulb; text: string; type: 'success' | 'warning' | 'info' }[] = [];

    // Best performing step
    if (steps.length > 1) {
      const bestStep = steps.reduce((a, b) => a.replyRate > b.replyRate ? a : b);
      const worstStep = steps.reduce((a, b) => a.replyRate < b.replyRate ? a : b);
      if (bestStep.replyRate > worstStep.replyRate * 1.3) {
        items.push({
          icon: Award,
          text: `Step ${bestStep.stepNumber} outperforms others by ${((bestStep.replyRate / worstStep.replyRate - 1) * 100).toFixed(0)}%. Consider A/B testing similar patterns.`,
          type: 'success',
        });
      }
    }

    // Conversion funnel insight
    const interestRate = funnel.replied > 0 ? (funnel.interested / funnel.replied) * 100 : 0;
    if (interestRate > 30) {
      items.push({
        icon: TrendingUp,
        text: `${interestRate.toFixed(0)}% of replies show interest - strong lead qualification.`,
        type: 'success',
      });
    } else if (interestRate < 15 && funnel.replied > 10) {
      items.push({
        icon: TrendingDown,
        text: `Only ${interestRate.toFixed(0)}% of replies show interest. Review targeting or messaging.`,
        type: 'warning',
      });
    }

    // Copy performance insight
    if (copyData?.subjects?.topPerformers && copyData.subjects.topPerformers.length > 0) {
      const topSubject = copyData.subjects.topPerformers[0];
      if (topSubject.replyRate > 5) {
        items.push({
          icon: Mail,
          text: `"${topSubject.subject.slice(0, 40)}..." achieves ${topSubject.replyRate}% reply rate.`,
          type: 'info',
        });
      }
    }

    return items.slice(0, 3); // Max 3 insights
  }, [steps, funnel, copyData]);

  if (insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-selery-gold/5 to-selery-gold/10 rounded-xl border border-selery-gold/20 p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-selery-gold/20 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-selery-gold" />
        </div>
        <h3 className="text-sm font-semibold text-selery-navy uppercase tracking-wide">AI Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          const colors = {
            success: 'text-green-700 bg-green-50',
            warning: 'text-amber-700 bg-amber-50',
            info: 'text-selery-cyan bg-selery-cyan/10',
          }[insight.type];
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${colors.split(' ')[1]}`}>
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${colors.split(' ')[0]}`} />
              <p className={`text-sm ${colors.split(' ')[0]}`}>{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONVERSION FUNNEL (Redesigned - Horizontal flow)
// ══════════════════════════════════════════════════════════════════════════════

function ConversionFunnel({ funnel }: { funnel: FastAnalytics['funnel'] }) {
  const steps = [
    { label: 'Total Leads', value: funnel.totalLeads, color: 'bg-gray-500' },
    { label: 'Contacted', value: funnel.contacted, color: 'bg-selery-cyan' },
    { label: 'Replied', value: funnel.replied, color: 'bg-selery-navy' },
    { label: 'Interested', value: funnel.interested, color: 'bg-selery-gold' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-fade-in">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Target className="h-4 w-4" />
        Conversion Funnel
      </h3>
      <div className="flex items-center gap-3">
        {steps.map((step, i) => {
          const prevValue = i > 0 ? steps[i - 1].value : step.value;
          const convRate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : '0';
          const widthPct = steps[0].value > 0 ? Math.max(20, (step.value / steps[0].value) * 100) : 100;

          return (
            <div key={step.label} className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                <div
                  className={`${step.color} text-white rounded-xl p-4 transition-all duration-500`}
                  style={{ opacity: 0.15 + (widthPct / 100) * 0.85 }}
                >
                  <p className="text-2xl font-bold text-selery-navy">{step.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 mt-1">{step.label}</p>
                </div>
                {i > 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">{convRate}%</p>
                )}
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABBED DEEP-DIVE SECTION (New - Progressive disclosure)
// ══════════════════════════════════════════════════════════════════════════════

type TabId = 'pipeline' | 'response' | 'copy' | 'demographics' | 'sender';

interface TabConfig {
  id: TabId;
  label: string;
  icon: typeof Building2;
}

const TABS: TabConfig[] = [
  { id: 'pipeline', label: 'Pipeline', icon: Building2 },
  { id: 'response', label: 'Response Intelligence', icon: Brain },
  { id: 'copy', label: 'Copy Performance', icon: Mail },
  { id: 'demographics', label: 'Demographics', icon: PieChart },
  { id: 'sender', label: 'Sender Health', icon: Globe },
];

function TabbedSection({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: Record<TabId, React.ReactNode>;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Tab Header */}
      <div className="border-b border-gray-200 bg-gray-50/50">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'text-selery-cyan bg-white border-b-2 border-selery-cyan -mb-px'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {children[activeTab]}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PIPELINE TAB CONTENT
// ══════════════════════════════════════════════════════════════════════════════

function PipelineTab({
  companies,
  replies,
  industries,
  campaigns,
}: {
  companies: DemographicDistribution[];
  replies: AnalyzedReply[];
  industries: string[];
  campaigns: Array<{ id: number; name: string }>;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const interestedCompanies = companies.filter(c => c.interestedCount > 0).slice(0, 8);

  const filteredReplies = useMemo(() => {
    return replies.filter((r) => {
      if (r.isAutomated && !r.isInterested) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fields = [r.name, r.email, r.company, r.title, r.replyText].join(' ').toLowerCase();
        return fields.includes(q);
      }
      return true;
    });
  }, [replies, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Hot Companies Grid */}
      {interestedCompanies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-selery-gold" />
            Hot Companies ({interestedCompanies.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {interestedCompanies.map((c) => {
              const companyReplies = replies.filter(r => r.company === c.label && r.isInterested);
              const latestReply = companyReplies[0];
              return (
                <div
                  key={c.label}
                  className="p-4 rounded-lg bg-selery-gold/5 border border-selery-gold/20 hover:border-selery-gold/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-selery-navy truncate max-w-[120px]" title={c.label}>
                      {c.label}
                    </span>
                    <span className="text-xs bg-selery-gold/20 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {c.interestedCount}
                    </span>
                  </div>
                  {latestReply && (
                    <p className="text-xs text-gray-500 truncate">
                      {latestReply.name} - {latestReply.title}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Replies Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Replies ({filteredReplies.length})
          </h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search replies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-selery-cyan/20 focus:border-selery-cyan"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase w-8"></th>
                <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase">Contact</th>
                <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase">Company</th>
                <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase">Sentiment</th>
                <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase">Intent</th>
                <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase">Summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredReplies.slice(0, 20).map((reply) => (
                <React.Fragment key={reply.replyId}>
                  <tr
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === reply.replyId ? null : reply.replyId)}
                  >
                    <td className="py-3 px-4">
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expandedId === reply.replyId ? 'rotate-90' : ''}`} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-selery-navy">{reply.name}</p>
                      {reply.title && <p className="text-xs text-gray-500">{reply.title}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{reply.company}</p>
                      <p className="text-xs text-gray-500">{reply.industry}</p>
                    </td>
                    <td className="py-3 px-4"><SentimentBadge sentiment={reply.sentiment} /></td>
                    <td className="py-3 px-4"><IntentBadge intent={reply.intent} /></td>
                    <td className="py-3 px-4 max-w-[200px]">
                      <p className="text-xs text-gray-500 line-clamp-2">{reply.summary}</p>
                    </td>
                  </tr>
                  {expandedId === reply.replyId && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="p-4">
                        <div className="bg-white rounded-lg border p-4">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Full Reply</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.replyText}</p>
                          {reply.buyingSignals.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-selery-gold font-semibold mb-1 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> Buying Signals
                              </p>
                              <ul className="text-xs text-amber-700 space-y-1">
                                {reply.buyingSignals.map((s, i) => <li key={i}>• {s}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredReplies.length > 20 && (
            <div className="p-3 text-center bg-gray-50 border-t">
              <p className="text-xs text-gray-500">Showing 20 of {filteredReplies.length} replies</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESPONSE INTELLIGENCE TAB
// ══════════════════════════════════════════════════════════════════════════════

function ResponseTab({
  report,
}: {
  report: AnalyticsReport | null;
}) {
  if (!report) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Loading response analysis...</p>
      </div>
    );
  }

  const { sentimentBreakdown, topThemes: themes, topObjections: objections, topBuyingSignals: buyingSignals } = report;

  return (
    <div className="space-y-6">
      {/* Sentiment Overview */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Sentiment Breakdown</h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'positive', label: 'Positive', color: 'bg-green-500', count: sentimentBreakdown.positive },
            { key: 'neutral', label: 'Neutral', color: 'bg-gray-400', count: sentimentBreakdown.neutral },
            { key: 'negative', label: 'Negative', color: 'bg-red-500', count: sentimentBreakdown.negative },
          ].map((item) => {
            const total = sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative;
            const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : '0';
            return (
              <div key={item.key} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-2`} />
                <p className="text-2xl font-bold text-selery-navy">{item.count}</p>
                <p className="text-xs text-gray-500">{item.label} ({pct}%)</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Themes & Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Themes */}
        <div className="bg-selery-cyan/5 rounded-lg p-4 border border-selery-cyan/20">
          <h4 className="text-sm font-semibold text-selery-navy mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-selery-cyan" />
            Top Themes
          </h4>
          <div className="space-y-2">
            {themes.slice(0, 5).map((t: { theme: string; count: number }, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{t.theme}</span>
                <span className="text-xs text-gray-500">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buying Signals */}
        <div className="bg-selery-gold/5 rounded-lg p-4 border border-selery-gold/20">
          <h4 className="text-sm font-semibold text-selery-navy mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-selery-gold" />
            Buying Signals
          </h4>
          <div className="space-y-2">
            {buyingSignals.slice(0, 5).map((s: { signal: string; count: number }, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">{s.signal}</span>
                <span className="text-xs text-gray-500">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Objections */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="text-sm font-semibold text-selery-navy mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Common Objections
          </h4>
          <div className="space-y-2">
            {objections.slice(0, 5).map((o: { objection: string; count: number }, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-red-700">{o.objection}</span>
                <span className="text-xs text-gray-500">{o.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COPY PERFORMANCE TAB
// ══════════════════════════════════════════════════════════════════════════════

function CopyTab({ copyData }: { copyData: CopyAnalysis | null }) {
  if (!copyData) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Loading copy analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Subjects */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Top Performing Subject Lines</h4>
        <div className="space-y-3">
          {copyData.subjects?.topPerformers?.slice(0, 5).map((s: { subject: string; sent: number; replyRate: number }, i: number) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-selery-navy truncate max-w-[400px]">{s.subject}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">{s.sent} sent</span>
                  <span className="font-semibold text-selery-cyan">{s.replyRate}% reply</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-selery-cyan rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(s.replyRate * 10, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DEMOGRAPHICS TAB (Accordion-based)
// ══════════════════════════════════════════════════════════════════════════════

function Accordion({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-selery-navy">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}

function HorizontalBarChart({ data, colorClass = 'bg-selery-cyan' }: { data: DemographicDistribution[]; colorClass?: string }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-selery-navy truncate max-w-[200px]">{item.label}</span>
            <span className="text-gray-500 text-xs">{item.count} ({item.percentage}%)</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${colorClass} rounded-full transition-all duration-500`}
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DemographicsTab({ report }: { report: AnalyticsReport | null }) {
  if (!report) {
    return (
      <div className="text-center py-12 text-gray-500">
        <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Loading demographics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion title="By Industry" icon={Building2} defaultOpen>
        <HorizontalBarChart data={report.industryDistribution} colorClass="bg-selery-cyan" />
      </Accordion>
      <Accordion title="By Company" icon={Briefcase}>
        <HorizontalBarChart data={report.topCompanies} colorClass="bg-selery-navy" />
      </Accordion>
      <Accordion title="By Seniority" icon={Users}>
        <HorizontalBarChart data={report.seniorityDistribution} colorClass="bg-selery-gold" />
      </Accordion>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SENDER HEALTH TAB
// ══════════════════════════════════════════════════════════════════════════════

function SenderTab({ senderData }: { senderData: SenderAnalytics | null }) {
  if (!senderData) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Loading sender data...</p>
      </div>
    );
  }

  const activeDomains = senderData.byDomain.filter(d => d.emailsSent > 0).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Provider Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {senderData.byProvider.map((p) => (
          <div key={p.provider} className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-selery-navy">{p.provider}</span>
              <span className="text-xs text-gray-500">({p.accountCount} accounts)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-selery-navy">{p.replyRate}%</p>
                <p className="text-xs text-gray-500">Reply</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${p.bounceRate > 2 ? 'text-red-600' : 'text-selery-navy'}`}>{p.bounceRate}%</p>
                <p className="text-xs text-gray-500">Bounce</p>
              </div>
              <div>
                <p className="text-lg font-bold text-selery-cyan">{p.replied}</p>
                <p className="text-xs text-gray-500">Replied</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Domain Table */}
      {activeDomains.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Domain Performance</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="h-9 px-4 text-left font-medium text-gray-500 text-xs uppercase">Domain</th>
                  <th className="h-9 px-4 text-right font-medium text-gray-500 text-xs uppercase">Sent</th>
                  <th className="h-9 px-4 text-right font-medium text-gray-500 text-xs uppercase">Reply %</th>
                  <th className="h-9 px-4 text-right font-medium text-gray-500 text-xs uppercase">Bounce %</th>
                </tr>
              </thead>
              <tbody>
                {activeDomains.map((d) => (
                  <tr key={d.domain} className="border-b hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-medium text-selery-navy">{d.domain}</td>
                    <td className="py-2.5 px-4 text-right text-gray-500">{d.emailsSent.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-medium">{d.replyRate}%</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={d.bounceRate > 3 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {d.bounceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN TABLE (Simplified)
// ══════════════════════════════════════════════════════════════════════════════

function CampaignTable({ campaigns }: { campaigns: CampaignComparisonItem[] }) {
  if (campaigns.length === 0) return null;

  const bestInterest = Math.max(...campaigns.map(c => c.interestRate));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-4 border-b bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Campaign Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="h-10 px-4 text-left font-medium text-gray-500 text-xs uppercase">Campaign</th>
              <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase">Sent</th>
              <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase">Reply %</th>
              <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase">Interest %</th>
              <th className="h-10 px-4 text-right font-medium text-gray-500 text-xs uppercase">Progress</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.slice(0, 10).map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${c.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-medium text-selery-navy truncate max-w-[200px]">
                      {c.name.replace(/^Cycle \d+:\s*/, '').replace(/^Campaign \d+,\s*/, '')}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-gray-500">{c.emailsSent.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-medium">{c.replyRate}%</td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-bold ${c.interestRate === bestInterest && c.interestRate > 0 ? 'text-selery-gold' : ''}`}>
                    {c.interestRate}%
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-selery-cyan rounded-full" style={{ width: `${Math.min(c.completionPct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{c.completionPct.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function AnalyticsPageRedesign() {
  // ─── State (Same as original) ────────────────────────────────────────────
  const [fastData, setFastData] = useState<FastAnalytics | null>(null);
  const [senderData, setSenderData] = useState<SenderAnalytics | null>(null);
  const [phase1Loading, setPhase1Loading] = useState(true);

  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [phase2Loading, setPhase2Loading] = useState(true);

  const [copyData, setCopyData] = useState<CopyAnalysis | null>(null);
  const [phase3Loading, setPhase3Loading] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('pipeline');
  const contentRef = useRef<HTMLDivElement>(null);

  // ─── Data Fetching (Same API calls as original) ─────────────────────────
  useEffect(() => {
    const fetchPhase1 = async () => {
      try {
        const [fastRes, senderRes] = await Promise.all([
          fetch('/api/analytics/fast'),
          fetch('/api/analytics/senders'),
        ]);
        if (fastRes.ok) {
          const { data } = await fastRes.json();
          setFastData(data);
        }
        if (senderRes.ok) {
          const { data } = await senderRes.json();
          setSenderData(data);
        }
      } catch (e) {
        console.error('Phase 1 error:', e);
      } finally {
        setPhase1Loading(false);
      }
    };

    const fetchPhase2 = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const { data } = await res.json();
          setReport(data);
        }
      } catch (e) {
        console.error('Phase 2 error:', e);
      } finally {
        setPhase2Loading(false);
      }
    };

    const fetchPhase3 = async () => {
      try {
        const res = await fetch('/api/analytics/copy');
        if (res.ok) {
          const { data } = await res.json();
          setCopyData(data);
        }
      } catch (e) {
        console.error('Phase 3 error:', e);
      } finally {
        setPhase3Loading(false);
      }
    };

    fetchPhase1();
    fetchPhase2();
    fetchPhase3();
  }, []);

  // ─── Export Handlers ────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      await exportPageToPDF(contentRef.current, 'analytics-report');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    // Transform replies to flat CSV-friendly format
    const csvData = report.replies.map(r => ({
      email: r.email,
      name: r.name,
      company: r.company,
      title: r.title,
      industry: r.industry,
      campaign: r.campaignName,
      sentiment: r.sentiment,
      intent: r.intent,
      isInterested: r.isInterested,
      replyDate: r.replyDate,
      summary: r.summary,
    }));
    exportToCSV(csvData, 'analytics-replies');
  };

  // ─── Loading State ──────────────────────────────────────────────────────
  if (phase1Loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-selery-cyan" />
          <span className="ml-3 text-gray-500">Loading analytics...</span>
        </div>
      </PageContainer>
    );
  }

  if (!fastData) {
    return (
      <PageContainer>
        <div className="text-center py-20 text-gray-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Failed to load analytics data</p>
        </div>
      </PageContainer>
    );
  }

  const activeCampaigns = fastData.campaignComparison?.filter(c => c.status?.toLowerCase() === 'active').length ?? 0;

  return (
    <PageContainer>
      <div ref={contentRef} className="space-y-6">
        {/* Executive Summary Bar */}
        <ExecutiveSummaryBar
          funnel={fastData.funnel}
          activeCampaigns={activeCampaigns}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
          exporting={exporting}
        />

        {/* Funnel + AI Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ConversionFunnel funnel={fastData.funnel} />
          </div>
          <div>
            <AIInsightsCard
              steps={fastData.sequenceStepPerformance}
              funnel={fastData.funnel}
              copyData={copyData}
            />
          </div>
        </div>

        {/* Campaign Table */}
        <CampaignTable campaigns={fastData.campaignComparison} />

        {/* Tabbed Deep-Dive Section */}
        <TabbedSection activeTab={activeTab} onTabChange={setActiveTab}>
          {{
            pipeline: (
              <PipelineTab
                companies={report?.topCompanies || []}
                replies={report?.replies || []}
                industries={report?.industries || []}
                campaigns={fastData.campaignComparison.map(c => ({ id: c.id, name: c.name }))}
              />
            ),
            response: <ResponseTab report={report} />,
            copy: <CopyTab copyData={copyData} />,
            demographics: <DemographicsTab report={report} />,
            sender: <SenderTab senderData={senderData} />,
          }}
        </TabbedSection>
      </div>
    </PageContainer>
  );
}
