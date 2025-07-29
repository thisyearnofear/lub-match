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
    "fc:frame": "vNext",
    "fc:frame:image": "/github-demo.gif",
    "fc:frame:button:1": "💝 Play Game",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "/",
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "/github-demo.gif",
      button: {
        title: "Play the Game",
        action: {
          type: "launch_frame",
          name: "lub match",
          splashImageUrl: "/hamster_jumping.gif",
          splashBackgroundColor: "#000000",
        },
      },
    }),
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
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="theme-color" content="#ec4899" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
