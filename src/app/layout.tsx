import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: "Lubbers Match",
  description: "Send lub & feel da lub!",
  keywords: [
    "Lubbers card game",
    "romantic proposal game",
    "photo card challenge",
    "send lub game",
    "couples game",
    "lub game",
    "proposal game",
  ],
  openGraph: {
    title: "Lubbers Match 💝",
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
    title: "Lubbers Match 💝",
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
          name: "Lubbers Match",
          splashImageUrl: "/hamster_jumping.gif",
          splashBackgroundColor: "#000000",
        },
      },
    }),
  },
};

// import { WagmiConfig } from "wagmi";
// import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
// import { wagmiConfig } from "@/wallet/wagmiConfig";
// import "@rainbow-me/rainbowkit/styles.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
