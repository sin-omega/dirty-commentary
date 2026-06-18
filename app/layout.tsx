// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Baloo_2 } from 'next/font/google';
import { dictionary } from '@/lib/dictionary';
import './globals.css';

// Inter z subsetem latin-ext - krytyczne dla poprawnego renderowania
// polskich znaków diakrytycznych (ą, ć, ę, ł, ń, ó, ś, ź, ż) na każdym
// urządzeniu. Używany jako font treści/UI.
const bodyFont = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

// Baloo 2 - zaokrąglony display font do nagłówków, kontrastujący z czystym
// sans-serif treści (sekcja 10 specyfikacji). Też z subsetem latin-ext.
const displayFont = Baloo_2({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: dictionary.brand.name,
  description: dictionary.public.subtitle,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className={`${bodyFont.variable} ${displayFont.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
