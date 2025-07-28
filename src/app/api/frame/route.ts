import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { untrustedData } = body;

    // Get the button that was pressed
    const buttonIndex = untrustedData?.buttonIndex || 1;

    // Base URL for the app
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    // Handle different frame interactions
    switch (buttonIndex) {
      case 1: // Play Game button
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${baseUrl}/github-demo.gif" />
              <meta property="fc:frame:button:1" content="🎮 Start Playing" />
              <meta property="fc:frame:button:1:action" content="link" />
              <meta property="fc:frame:button:1:target" content="${baseUrl}" />
              <meta property="fc:frame:button:2" content="💝 Send Lub" />
              <meta property="fc:frame:button:2:action" content="link" />
              <meta property="fc:frame:button:2:target" content="${baseUrl}/create" />
              <meta property="og:image" content="${baseUrl}/github-demo.gif" />
              <meta property="og:title" content="Lubber's Memory Game 💝" />
              <meta property="og:description" content="A romantic heart-shaped memory game!" />
            </head>
            <body>
              <p>Welcome to Valentine Memory Game! Click to start playing.</p>
            </body>
          </html>`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/html",
            },
          }
        );

      case 2: // Share button
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${baseUrl}/github-demo.gif" />
              <meta property="fc:frame:button:1" content="🎮 Play Again" />
              <meta property="fc:frame:button:1:action" content="link" />
              <meta property="fc:frame:button:1:target" content="${baseUrl}" />
              <meta property="fc:frame:button:2" content="💝 Send Your Lub" />
              <meta property="fc:frame:button:2:action" content="link" />
              <meta property="fc:frame:button:2:target" content="${baseUrl}/create" />
              <meta property="og:image" content="${baseUrl}/hamster_jumping.gif" />
              <meta property="og:title" content="Thanks for playing! 💕" />
              <meta property="og:description" content="Share this romantic game with someone special!" />
            </head>
            <body>
              <p>Thanks for playing! Share with someone special 💕</p>
            </body>
          </html>`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/html",
            },
          }
        );

      default:
        // Default frame response
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${baseUrl}/github-demo.gif" />
              <meta property="fc:frame:button:1" content="💝 Play Lubber's Game" />
              <meta property="fc:frame:button:1:action" content="link" />
              <meta property="fc:frame:button:1:target" content="${baseUrl}" />
              <meta property="og:image" content="${baseUrl}/github-demo.gif" />
              <meta property="og:title" content="Lubber's Memory Game 💝" />
              <meta property="og:description" content="A romantic heart-shaped memory game to send lub to your special someone!" />
            </head>
            <body>
              <p>Valentine Memory Game - A romantic way to ask someone special! 💝</p>
            </body>
          </html>`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/html",
            },
          }
        );
    }
  } catch (error) {
    console.error("Frame API error:", error);

    return new NextResponse(
      JSON.stringify({ error: "Frame processing failed" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Handle GET requests for frame validation
export async function GET() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/github-demo.gif" />
        <meta property="fc:frame:button:1" content="💝 Play Lubber's Game" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${baseUrl}" />
        <meta property="og:image" content="${baseUrl}/github-demo.gif" />
        <meta property="og:title" content="Lubber's Memory Game 💝" />
        <meta property="og:description" content="A romantic heart-shaped memory game to send lub to your special someone!" />
      </head>
      <body>
        <h1>Valentine Memory Game 💝</h1>
        <p>A romantic heart-shaped memory game to ask your special someone to be your Valentine!</p>
        <a href="${baseUrl}">Play Now</a>
      </body>
    </html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
