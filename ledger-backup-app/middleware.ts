import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow access to /login and static files
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // for favicon, images, etc.
    ) {
        return NextResponse.next();
    }

    // 2. Check for auth cookie
    const isAuthenticated = request.cookies.get('auth-token');

    // 3. Redirect to login if not authenticated
    if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
