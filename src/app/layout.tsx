import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sylvy | AI Lab Assistant for Wet Lab Research",
  description:
    "Sylvy is an AI-native lab assistant that structures experiments, analyzes results, and learns from your lab's own data to accelerate wet lab and pharma research.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&family=Inter:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {process.env.NODE_ENV === "development" && (
          <Script id="suppress-extension-errors" strategy="beforeInteractive">
            {suppressExtensionErrorsScript}
          </Script>
        )}
        {children}
      </body>
    </html>
  );
}
