// App constants

export const APP_NAME = 'SearchAtlas Dashboard';

export const COOKIE_NAME = 'emailbison_token';

export const DATE_RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
] as const;

export const CAMPAIGN_STATUSES = [
  'draft',
  'launching',
  'active',
  'stopped',
  'completed',
  'paused',
  'failed',
  'queued',
  'archived',
] as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-500', text: 'text-white' },
  paused: { bg: 'bg-amber-500', text: 'text-white' },
  draft: { bg: 'bg-gray-200', text: 'text-gray-700' },
  launching: { bg: 'bg-[#1DA89D]', text: 'text-white' },
  completed: { bg: 'bg-purple-500', text: 'text-white' },
  stopped: { bg: 'bg-red-500', text: 'text-white' },
  failed: { bg: 'bg-red-600', text: 'text-white' },
  queued: { bg: 'bg-gray-300', text: 'text-gray-700' },
  archived: { bg: 'bg-gray-400', text: 'text-white' },
};

export const CHART_COLORS = {
  // Funnel stages are ordinal, not categorical: one hue, stepped lightness,
  // so the order reads in the colour itself. Validated against --background #0F1614.
  sent: '#0D625C',
  opens: '#168179',
  replies: '#1E9F95',
  interested: '#50BCB2',
  // Reserved status colours — never reused as a series hue.
  bounced: '#EF7A6C',
  unsubscribed: '#6E7C78',
};
