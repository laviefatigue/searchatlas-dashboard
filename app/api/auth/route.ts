import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!DASHBOARD_PASSWORD) {
      // If no password is configured, deny access
      return NextResponse.json(
        { error: 'Dashboard password not configured' },
        { status: 500 }
      );
    }

    if (password !== DASHBOARD_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Password is correct - set auth cookie
    const response = NextResponse.json({ success: true });

    // Set httpOnly cookie with 7 day expiry
    // secure: true only when accessed over HTTPS (not just NODE_ENV)
    const isHttps = request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https');
    response.cookies.set('dashboard_auth', 'authenticated', {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  // Logout - clear auth cookie
  const response = NextResponse.json({ success: true });

  response.cookies.set('dashboard_auth', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
