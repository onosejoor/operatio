import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'docs', 'localhost']

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  // Skip proxy for reserved subdomains or main domain
  if (RESERVED_SUBDOMAINS.includes(subdomain) || hostname.split('.').length <= 2) {
    return NextResponse.next()
  }

  // Rewrite subdomain to status page route
  const url = request.nextUrl.clone()
  url.pathname = `/status/${subdomain}`

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
