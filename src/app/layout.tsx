import type { Metadata, Viewport } from "next";
import PWAProvider from "@/components/PWAProvider";
import "./globals.css";

const APP_NAME = "Pocket Click";
const APP_DESCRIPTION = "A no-frills metronome for practice.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0e0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden overscroll-none">
      <body className="fixed inset-0 flex h-full w-full touch-none flex-col overflow-hidden overscroll-none bg-[#0e0e0f] text-[#e8e0d0] antialiased">
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
