import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "next-themes";
import { bentonSans } from "@/lib/fonts";
import "./globals.css";


export const metadata: Metadata = {
  title: "Ensemble - Team Operations Platform",
  description: "Internal web platform for simplifying and centralizing daily operations for teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={bentonSans.className}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <div className="min-h-screen bg-background">
              <main className="flex-1">
                {children}
              </main>
            </div>
            <Toaster
              position="top-right"
              expand={false}
              closeButton
            />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
