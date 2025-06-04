import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Local Guide | San Francisco Local Discovery - Restaurants, Bars, Coffee",
  description: "Curated San Francisco venue directory. Find the best restaurants, bars, coffee shops, and local spots. Substance over style - authentic recommendations from SF locals.",
  keywords: "San Francisco restaurants, SF bars, San Francisco coffee shops, Mission District food, Castro bars, Marina restaurants, North Beach cafes, SF local guide",
  authors: [{ name: "My Local Guide" }],
  creator: "My Local Guide",
  publisher: "My Local Guide",
  robots: "index, follow",
  openGraph: {
    title: "My Local Guide | San Francisco Local Discovery",
    description: "Curated SF venue directory focusing on substance over style. Find authentic local recommendations for restaurants, bars, and coffee shops.",
    url: "https://mylocalguide.co",
    siteName: "My Local Guide",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "My Local Guide | San Francisco Local Discovery",
    description: "Curated SF venues - restaurants, bars, coffee. Authentic local recommendations without the noise.",
  },
  alternates: {
    canonical: "https://mylocalguide.co",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
