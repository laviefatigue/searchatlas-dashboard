import { NextRequest, NextResponse } from 'next/server';

const AI_ARK_BASE = 'https://api.ai-ark.com/api/developer-portal/v1';
const AI_ARK_TOKEN = process.env.AI_ARK_API_KEY || '';

export interface EnrichedContact {
  email: string;
  fullName: string | null;
  title: string | null;
  headline: string | null;
  linkedinUrl: string | null;
  location: string | null;
  company: string | null;
  phone: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractContact(json: any): Omit<EnrichedContact, 'email'> {
  // AI-Ark reverse-lookup returns a flat object with:
  //   profile { full_name, first_name, last_name, headline, title }
  //   link { linkedin }
  //   location { short, default, city, state, country }
  //   company { summary { name } }
  const profile = json?.profile || {};
  const link = json?.link || {};
  const loc = json?.location || {};
  const company = json?.company?.summary?.name || null;

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    null;

  return {
    fullName,
    title: profile.title || null,
    headline: profile.headline || null,
    linkedinUrl: link.linkedin || null,
    location: loc.short || loc.default || null,
    company,
    phone: null, // AI-Ark doesn't return phone in reverse-lookup
  };
}

async function lookupEmail(email: string): Promise<EnrichedContact> {
  const empty: EnrichedContact = {
    email,
    fullName: null,
    title: null,
    headline: null,
    linkedinUrl: null,
    location: null,
    company: null,
    phone: null,
  };

  try {
    const res = await fetch(`${AI_ARK_BASE}/people/reverse-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TOKEN': AI_ARK_TOKEN,
      },
      body: JSON.stringify({ kind: 'CONTACT', search: email }),
    });

    if (!res.ok) return empty;

    const json = await res.json();
    if (!json || !json.profile) return empty;

    return { email, ...extractContact(json) };
  } catch {
    return empty;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emails: string[] = body.emails;

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'emails array required' }, { status: 400 });
    }

    // Cap at 20 to avoid rate limits (AI-Ark: 5/sec, 300/min)
    const capped = emails.slice(0, 20);

    // Process in batches of 4 to respect 5/sec rate limit
    const results: EnrichedContact[] = [];
    for (let i = 0; i < capped.length; i += 4) {
      const batch = capped.slice(i, i + 4);
      const batchResults = await Promise.all(batch.map(lookupEmail));
      results.push(...batchResults);
      if (i + 4 < capped.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Enrich API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
