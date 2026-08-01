import { NextResponse } from 'next/server';

// Server-side only: ADMIN_PASSWORD has no NEXT_PUBLIC_ prefix, so it never
// ships in the client JS bundle (unlike the old client-side string compare).
export async function POST(request: Request) {
    const { password } = await request.json();
    const expected = process.env.ADMIN_PASSWORD || 'Mavunaku656!';

    if (!expected || password !== expected) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set('auth-token', 'true', {
        path: '/',
        maxAge: 86400,
        httpOnly: true,
        sameSite: 'lax',
    });
    return response;
}
