import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nolia - AI-drevet LinkedIn værktøj",
  description: "Skab stærke LinkedIn-opslag på få minutter med din egen AI-assistent. Nolia lærer din stemme og dit publikum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body
        className={`${figtree.variable} font-figtree antialiased min-h-screen flex flex-col`}
      >
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}