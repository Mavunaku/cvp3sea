import { NextResponse } from 'next/server';

// The auth cookie is httpOnly, so it can only be cleared from a server response.
export async function POST() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('auth-token', '', { path: '/', maxAge: 0 });
    return response;
}
