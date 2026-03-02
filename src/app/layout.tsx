import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { PostHogProvider } from "@/components/layout/PostHogProvider";
import { PostHogPageView } from "@/components/layout/PostHogPageView";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sylvy | AI Lab Assistant for Wet Lab Research",
  description:
    "Sylvy is an AI-native lab assistant that structures experiments, analyzes results, and learns from your lab's own data to accelerate wet lab and pharma research.",
  applicationName: "Sylvy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sylvy",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const suppressExtensionErrorsScript = `
(function () {
  var message = "Cannot redefine property: ethereum";
  window.addEventListener(
    "error",
    function (event) {
      if (!event) {
        return;
      }
      var filename = event.filename || "";
      var errorMessage = event.message || "";
      if (
        filename.startsWith("chrome-extension://") &&
        errorMessage.indexOf(message) !== -1
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Sylvy" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#faf9f6" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#020617" />
        <link rel="apple-touch-icon" href="/pwa/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&family=Inter:wght@300..700&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
          media="print"
          id="fonts-stylesheet"
        />
        <Script id="fonts-async" strategy="afterInteractive">
          {`(function(){var l=document.getElementById('fonts-stylesheet');if(l){l.media='print';l.onload=function(){l.media='all';};if(l.sheet)l.media='all';}})();`}
        </Script>
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&family=Inter:wght@300..700&family=JetBrains+Mono:wght@400;600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>
      </head>
      <body className="antialiased">
        <div className="pwa-loading-shell" aria-hidden="true">
          <div className="pwa-loading-shell-inner">
            <div className="pwa-loading-spinner" />
            <span className="pwa-loading-text">Sylvy</span>
          </div>
        </div>
        {process.env.NODE_ENV === "development" && (
          <Script id="suppress-extension-errors" strategy="beforeInteractive">
            {suppressExtensionErrorsScript}
          </Script>
        )}
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <ThemeProvider>{children}</ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
