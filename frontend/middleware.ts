import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  const protectedPaths = ['/', '/profile', '/settings', '/subscriptions', '/create']
  const isProtected = protectedPaths.includes(pathname)

  // Roteamento do root: sem sessão -> /login; com sessão -> /newsletter/{name-slug}
  if (pathname === '/') {
    const url = req.nextUrl.clone()
    if (!session) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    const name = (session.user?.user_metadata?.name as string | undefined) || session.user?.email || 'usuario'
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')
    url.pathname = `/newsletter/${nameSlug}`
    return NextResponse.redirect(url)
  }

  if (isProtected && !session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return res
}

export const config = {
  // Garante execução do middleware em todas as rotas; a lógica interna decide quando redirecionar
  matcher: ['/(.*)']
}
//att