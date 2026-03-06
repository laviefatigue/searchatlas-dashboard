import { NextResponse } from 'next/server';

const EMAILBISON_API_URL = process.env.EMAILBISON_API_URL || 'https://spellcast.hirecharm.com';
const EMAILBISON_API_TOKEN = process.env.EMAILBISON_API_TOKEN || '';

// Environment-driven workspace configuration
const WORKSPACE_ID = parseInt(process.env.WORKSPACE_ID || '0', 10);

export async function GET() {
  try {
    // Switch to configured workspace first
    if (WORKSPACE_ID > 0) {
      await fetch(`${EMAILBISON_API_URL}/api/workspaces/switch-workspace`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EMAILBISON_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_id: WORKSPACE_ID }),
      });
    }

    const response = await fetch(`${EMAILBISON_API_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${EMAILBISON_API_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
