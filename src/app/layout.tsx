import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "dasADS | Modern ATS Hub",
  description: "Premium SaaS Platform for Recruiting",
};

import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} font-sans antialiased text-gray-900 bg-gray-50`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
