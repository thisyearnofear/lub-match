import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: "Lub Match",
  description: "Send lub & feel da lub!",
  keywords: [
    "Lub Match",
    "memory card game",
    "romantic proposal game",
    "photo card challenge",
    "send lub game",
    "couples game",
    "lub game",
    "proposal game",
  ],
  openGraph: {
    title: "lub match 💝",
    description:
      "A romantic heart-shaped memory game to send lub to your special someone!",
    images: [
      {
        url: "/github-demo.gif",
        width: 1200,
        height: 630,
        alt: "Valentine Memory Game Demo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "lub match 💝",
    description:
      "A romantic heart-shaped memory game to send lub to your special someone!",
    images: ["/github-demo.gif"],
  },
  other: {
    // Frames v2 (Mini Apps) metadata
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "/github-demo.gif",
      button: {
        title: "💝 Play Lub Match!",
        action: {
          type: "launch_frame",
          name: "Lub Match",
          url: "/",
          splashImageUrl: "/hamster_jumping.gif",
          splashBackgroundColor: "#000000",
        },
      },
    }),
    // Legacy v1 frame support
    "fc:frame:image": "/github-demo.gif",
    "fc:frame:button:1": "💝 Play Game",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "/",
  },
};

import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#ec4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Lub Match" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* CSS for safe area handling */
            :root {
              --safe-area-inset-top: env(safe-area-inset-top);
              --safe-area-inset-right: env(safe-area-inset-right);
              --safe-area-inset-bottom: env(safe-area-inset-bottom);
              --safe-area-inset-left: env(safe-area-inset-left);
            }

            /* Prevent zoom on input focus */
            input, select, textarea {
              font-size: 16px !important;
            }

            /* Smooth scrolling for mobile */
            * {
              -webkit-overflow-scrolling: touch;
            }
          `,
          }}
        />
      </head>
      <body>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
