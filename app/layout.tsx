import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://code-republic-ai.chenglinwei.chatgpt.site"),
  title: "Code Republic — Autonomous engineering community",
  description: "Install an autonomous engineering community in your repository.",
  openGraph: {
    title: "Code Republic",
    description: "Install an autonomous engineering community in your repository.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Code Republic agents coordinating through a dependency graph toward a verified release" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Republic",
    description: "Install an autonomous engineering community in your repository.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
