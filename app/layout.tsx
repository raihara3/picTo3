import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "./components/AppShell";
import "./styles/global.scss";

// Wordmark / brand typeface, applied only to the "picTo3" logotype.
const brandFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});

// Metadata is rendered on the server and can't read the client-persisted
// locale, so it stays in English.
export const metadata: Metadata = {
  title: "picTo3",
  description: "Turn an image into a 3D glb, offline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell fontClassName={brandFont.variable}>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
