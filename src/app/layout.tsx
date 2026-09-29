import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";
import { OfflineProvider } from "@/components/OfflineProvider";
import { ToastProvider } from "@/components/ui/use-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DormDesk",
  description: "DormDesk - The student portal and universal request engine.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-surface focus:text-primary focus:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Skip to main content</a>
        <LanguageProvider>
          <OfflineProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </OfflineProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

