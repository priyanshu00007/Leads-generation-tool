import type { Metadata, Viewport } from "next";
import { Inter, Calistoga, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const calistoga = Calistoga({ variable: "--font-display", subsets: ["latin"], weight: "400", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  title: {
    default: "Lead → Launch | AI-Powered Local Business Pipeline",
    template: "%s | Lead → Launch",
  },
  description:
    "Find local businesses that need a website. AI-powered lead generation, website audit, ranking, builder prompt, and cold outreach — all in one pipeline. Built for Indian freelancers.",
  keywords: [
    "lead generation",
    "local business",
    "freelancer pipeline",
    "website outreach",
    "cold email",
    "WhatsApp marketing",
    "Indian businesses",
    "Google Maps scraping",
    "Gemini AI",
    "website builder",
    "SEO audit",
    "PageSpeed",
    "lead to launch",
    "freelance clients",
    "local SEO",
  ],
  authors: [{ name: "Lead → Launch" }],
  creator: "Lead → Launch",
  publisher: "Lead → Launch",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://lead-to-launch.app",
    siteName: "Lead → Launch",
    title: "Lead → Launch | AI-Powered Local Business Pipeline",
    description:
      "Find local businesses that need a website. AI-powered lead generation, audit, ranking, builder, and outreach — all in one pipeline.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Lead → Launch — AI-Powered Local Business Pipeline",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lead → Launch | AI-Powered Local Business Pipeline",
    description:
      "Find local businesses that need a website. AI-powered lead generation, audit, ranking, builder, and outreach.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://lead-to-launch.app",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Lead → Launch",
  url: "https://lead-to-launch.app",
  description:
    "AI-powered local business pipeline: find leads, audit websites, rank prospects, generate website prompts, and send outreach messages.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  featureList: [
    "AI-powered lead generation with Gemini",
    "Website performance audit",
    "Lead scoring and ranking",
    "Website builder prompt generator",
    "Multi-channel outreach (WhatsApp, Email, Instagram)",
    "Hinglish and English message templates",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${calistoga.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#faf6ee" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Providers>
            {children}
            <Toaster position="bottom-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
