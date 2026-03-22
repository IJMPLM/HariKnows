import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProvider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HariKnows | Your Smart Campus Companion",
  description:
    "HariKnows helps you find answers, review transactions, and chat with Jaithro — your AI-powered campus assistant.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={plusJakarta.variable} suppressHydrationWarning>
      <body className={plusJakarta.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}