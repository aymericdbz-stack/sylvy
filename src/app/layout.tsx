import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sylvy | SaaS for pharmaceutical labs",
  description:
    "Sylvy is the B2B SaaS platform helping pharmaceutical labs digitize workflows, manage samples, and accelerate discovery.",
};

///test

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
