import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AR Smart Menu — Interactive 3D restaurant menus",
    template: "%s · AR Smart Menu",
  },
  description:
    "Turn your restaurant menu into an immersive 3D / AR experience. Generate QR codes, track AR views, and process orders in real time.",
  applicationName: "AR Smart Menu",
  keywords: ["AR menu", "3D menu", "restaurant QR", "AR restaurant", "menu QR code"],
  authors: [{ name: "AR Smart Menu" }],
  openGraph: {
    title: "AR Smart Menu",
    description:
      "Interactive 3D & AR menus for restaurants. Generate QR codes, track views, take orders.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "AR Smart Menu" },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-outfit h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        <MotionConfig reducedMotion="user">
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </MotionConfig>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0e0e16',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0e0e16' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0e0e16' } },
          }}
        />
      </body>
    </html>
  );
}
