import type { Metadata } from "next";
import "./globals.css";
import { playfairDisplay } from "@/styles/fonts";

// Helper function to get the base URL
function getBaseUrl() {
  return process.env.NODE_ENV === "production"
    ? "https://lub-match.vercel.app"
    : "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://lub-match.vercel.app"
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
        url: "/game-photos/lubmatch.png",
        width: 1200,
        height: 630,
        alt: "Lub Match - Romantic Memory Game",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "lub match 💝",
    description:
      "A romantic heart-shaped memory game to send lub to your special someone!",
    images: ["/game-photos/lubmatch.png"],
  },
  other: {
    // Mini App embed metadata (new format)
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${getBaseUrl()}/game-photos/lub.png`,
      button: {
        title: "💝 Play Lub Match!",
        action: {
          type: "launch_miniapp",
          name: "Lub Match",
          url: getBaseUrl(),
          splashImageUrl: `${getBaseUrl()}/game-photos/lub.png`,
          splashBackgroundColor: "#ec4899",
        },
      },
    }),
    // Backward compatibility
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: `${getBaseUrl()}/game-photos/lub.png`,
      button: {
        title: "💝 Play Lub Match!",
        action: {
          type: "launch_frame",
          name: "Lub Match",
          url: getBaseUrl(),
          splashImageUrl: `${getBaseUrl()}/game-photos/lub.png`,
          splashBackgroundColor: "#ec4899",
        },
      },
    }),
  },
};

import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={playfairDisplay.variable}>
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
        <OnboardingProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </OnboardingProvider>
      </body>
    </html>
  );
}
