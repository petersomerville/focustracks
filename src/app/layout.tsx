import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SentryInit from "@/components/SentryInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FocusTracks - Music for Focus & Productivity",
  description: "Discover and share music that enhances focus and productivity for work and study",
  keywords: ["focus music", "productivity music", "study music", "ambient music", "concentration music", "work music", "background music"],
  authors: [{ name: "FocusTracks" }],
  creator: "FocusTracks",
  publisher: "FocusTracks",
  metadataBase: new URL('https://focustracks-ochre.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://focustracks-ochre.vercel.app',
    siteName: 'FocusTracks',
    title: 'FocusTracks - Music for Focus & Productivity',
    description: 'Discover curated focus music tracks designed to enhance your concentration during work and study. Browse ambient, classical, and electronic music.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FocusTracks - Music for Focus & Productivity',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@focustracks',
    creator: '@focustracks',
    title: 'FocusTracks - Music for Focus & Productivity',
    description: 'Discover curated focus music for work and study. Browse ambient, classical, and electronic tracks.',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Add your verification code when you have it
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme script - must run before body renders */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                const resolvedTheme = theme === 'system'
                  ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                  : theme;
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(resolvedTheme);
              } catch (e) {
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add('light');
              }
            `,
          }}
        />

        {/* Structured Data (JSON-LD) for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'FocusTracks',
              description: 'Discover and share music that enhances focus and productivity for work and study',
              url: 'https://focustracks-ochre.vercel.app',
              applicationCategory: 'MusicApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Organization',
                name: 'FocusTracks',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://focustracks-ochre.vercel.app/?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <SentryInit />
              {children}
              <Toaster />
              <Analytics />
              <SpeedInsights />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
