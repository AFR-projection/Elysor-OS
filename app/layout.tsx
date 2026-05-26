import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PAIOS — Personal AI Operating System",
  description:
    "A futuristic personal AI operating system — not just a chatbot.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-dvh antialiased`}
      suppressHydrationWarning
    >
      {/* Browser extensions (password managers, etc.) inject attrs on <body> before hydrate */}
      <body
        className={`${geistSans.className} h-dvh overflow-hidden font-sans antialiased overscroll-none`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
