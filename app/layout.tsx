import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";
import {Toaster} from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  display: "swap",
});


export const metadata: Metadata = {
  title: "Intervio",
  description: "AI generated prep tool",
  applicationName: "Intervio",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${monaSans.className} antialiased pattern`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
