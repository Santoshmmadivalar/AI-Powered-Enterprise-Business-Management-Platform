import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Outpro.India | Premium Enterprise Software & Brand UX Solutions',
    template: '%s | Outpro.India'
  },
  description: 'Outpro.India designs and develops elite digital architectures. From custom software engineering and headless commerce to cloud migrations and premium UI/UX design.',
  keywords: ['enterprise software development', 'headless commerce', 'React developer', 'Next.js agency', 'UI/UX design Kolkata', 'AWS Cloud Solutions', 'Outpro India'],
  authors: [{ name: 'Outpro.India Team' }],
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Outpro.India | Premium Enterprise Software & Brand UX Solutions',
    description: 'Outpro.India designs and develops elite digital architectures, headless B2B commerce, and brand identity experiences.',
    url: 'https://outpro.in',
    siteName: 'Outpro.India',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outpro.India | Premium Enterprise Software Solutions',
    description: 'Bespoke custom software and brand design engineered for high speed and scale.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`} style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-all duration-300">
        <ThemeProvider>
          <Navbar />
          <main className="flex-grow pt-20">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
