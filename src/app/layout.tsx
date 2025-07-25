import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valentine Memory Game",
  description: "Create & share a heart-shaped memory card game!",
  keywords: [
    "Valentine's card game",
    "romantic proposal game",
    "photo card challenge",
    "Valentine's Day surprise",
    "couples game",
    "valentine's day game",
    "proposal game",
  ],
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: "https://YOUR_DOMAIN/og-default.png",
      button: {
        title: "Play the Game",
        action: {
          type: "launch_frame",
          name: "Valentine Game",
          splashImageUrl: "https://YOUR_DOMAIN/icon-200.png",
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
};

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
