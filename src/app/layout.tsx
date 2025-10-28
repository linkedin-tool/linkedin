import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Basic Platform - Administrer dine abonnementer",
  description: "En simpel og kraftfuld platform til at håndtere brugerregistrering, betalinger og abonnementer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body
        className={`${geist.variable} font-geist antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}