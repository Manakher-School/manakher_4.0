import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { DialogProvider } from "@/context/dialog-context";
import { SettingsProvider } from "@/context/settings-context";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مدرسة مناخر الاساسية المؤنثة",
  description: "المنصة التعليمية الرسمية لمدرسة مناخر الاساسية المؤنثة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className="min-h-full bg-surface text-ink antialiased">
        <ErrorBoundary>
          <SettingsProvider>
            <DialogProvider>
              <AuthProvider>{children}</AuthProvider>
            </DialogProvider>
          </SettingsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
