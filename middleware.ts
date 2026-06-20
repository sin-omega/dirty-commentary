// middleware.ts
//
// Chroni wszystkie ścieżki /admin/* poza /admin/login i /admin/activate/[token]
// (te dwie nie wymagają sesji - to wejście do systemu, nie panel).
// Sprawdza sesję Supabase, redirect do /admin/login jeśli brak sesji.
// Dodatkowo: jeśli zalogowany operator wejdzie na /admin, przepuszczamy go
// (operator też może obsługiwać kolejkę), ale /master wymaga is_operator=true.

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];

function isPublicAdminPath(pathname: string): boolean {
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/admin/activate/')) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // getUser() robi rzeczywiste zapytanie sieciowe do Supabase Auth - w
    // razie awarii sieci/timeoutu traktujemy to jak brak zalogowanego
    // użytkownika zamiast wywalać całą odpowiedź 500-tką.
    user = null;
  }

  const { pathname } = request.nextUrl;

  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/master');

  if (!isAdminArea) {
    return response;
  }

  if (isPublicAdminPath(pathname)) {
    // Zalogowany użytkownik wchodzący na /admin/login -> przekieruj do
    // właściwego panelu (operator do /master, zwykły admin do /admin).
    if (user && pathname === '/admin/login') {
      let isOperator = false;
      try {
        const { data: profile } = await supabase
          .from('admin_profiles')
          .select('is_operator')
          .eq('id', user.id)
          .single<{ is_operator: boolean }>();
        isOperator = profile?.is_operator === true;
      } catch {
        // Query na admin_profiles nie powiodło się (np. RLS recursion,
        // brak wiersza profilu) — bezpieczny fallback do /admin.
        isOperator = false;
      }

      const destination = isOperator ? '/master' : '/admin';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return response;
  }

  if (!user) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // /master wymaga is_operator = true - sprawdzane też w samym page.tsx jako
  // druga linia obrony, ale tu odcinamy najwcześniej możliwe.
  if (pathname.startsWith('/master')) {
    let isOperator = false;
    try {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('is_operator')
        .eq('id', user.id)
        .single<{ is_operator: boolean }>();
      isOperator = profile?.is_operator === true;
    } catch {
      // Query na admin_profiles nie powiodło się — bezpieczny fallback.
      isOperator = false;
    }

    if (!isOperator) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/master/:path*'],
};
