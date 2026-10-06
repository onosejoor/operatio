import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'docs']

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const configuredRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
  const rootUrl = new URL(
    configuredRoot.includes('://') ? configuredRoot : `http://${configuredRoot}`,
  )
  const requestHost = hostname.split(':')[0].toLowerCase()
  const rootHost = rootUrl.hostname.toLowerCase()

  // Only rewrite a single subdomain directly under the configured root domain.
  if (requestHost === rootHost || !requestHost.endsWith(`.${rootHost}`)) {
    return NextResponse.next()
  }

  const subdomain = requestHost.slice(0, -(rootHost.length + 1))
  if (!subdomain || subdomain.includes('.') || RESERVED_SUBDOMAINS.includes(subdomain)) {
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
