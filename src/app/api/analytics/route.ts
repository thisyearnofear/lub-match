import { NextRequest, NextResponse } from "next/server";

// Analytics API endpoint for collecting user events
// This is optional - analytics can work entirely client-side for privacy

interface AnalyticsEvent {
  type: string;
  timestamp: string;
  sessionId: string;
  data: Record<string, any>;
  metadata?: {
    userAgent?: string;
    referrer?: string;
    platform?: string;
    walletConnected?: boolean;
    chainId?: number;
  };
}

// In production, you might want to:
// 1. Store events in a database (PostgreSQL, MongoDB, etc.)
// 2. Send to analytics services (Mixpanel, Amplitude, etc.)
// 3. Process events for real-time dashboards
// 4. Implement rate limiting and validation

export async function POST(request: NextRequest) {
  try {
    // Check if request has content
    const contentLength = request.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      console.warn("Analytics API: Received empty request body");
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // Get the raw body first to check if it's empty
    const body = await request.text();
    if (!body || body.trim() === '') {
      console.warn("Analytics API: Received empty or whitespace-only body");
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // Parse JSON with better error handling
    let event: AnalyticsEvent;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error("Analytics API: JSON parse error:", parseError, "Body:", body);
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // Validate event structure
    if (!event.type || !event.timestamp || !event.sessionId) {
      console.warn("Analytics API: Invalid event structure:", event);
      return NextResponse.json(
        { error: "Invalid event structure - missing required fields" },
        { status: 400 }
      );
    }

    // Add server-side metadata
    const enrichedEvent = {
      ...event,
      serverTimestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    };

    // Log event (in production, save to database)
    console.log("📊 Analytics Event Received:", {
      type: enrichedEvent.type,
      timestamp: enrichedEvent.timestamp,
      sessionId: enrichedEvent.sessionId,
      data: enrichedEvent.data,
    });

    // Example: Save to database
    // await saveEventToDatabase(enrichedEvent);

    // Example: Send to external analytics service
    // await sendToAnalyticsService(enrichedEvent);

    // Example: Update real-time metrics
    // await updateRealTimeMetrics(enrichedEvent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: "Failed to process analytics event" },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving analytics data (admin only)
export async function GET(request: NextRequest) {
  try {
    // In production, add authentication/authorization here
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "24h";
    const eventType = searchParams.get("eventType");

    // Example: Retrieve analytics data from database
    // const analytics = await getAnalyticsFromDatabase(timeRange, eventType);

    // For now, return mock data
    const mockAnalytics = {
      timeRange,
      eventType,
      summary: {
        totalEvents: 150,
        uniqueSessions: 45,
        topEvents: [
          { type: "lub_created", count: 25 },
          { type: "game_complete", count: 40 },
          { type: "game_shared", count: 15 },
          { type: "wallet_connected", count: 8 },
          { type: "nft_minted", count: 3 },
        ],
      },
      metrics: {
        userGrowth: 12.5, // percentage
        engagement: 68.3, // percentage
        conversion: 17.8, // percentage
      },
    };

    return NextResponse.json(mockAnalytics);
  } catch (error) {
    console.error("Analytics GET API Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve analytics data" },
      { status: 500 }
    );
  }
}

// Helper functions for production use

async function saveEventToDatabase(event: AnalyticsEvent & { serverTimestamp: string; ip: string }) {
  // Example implementation:
  // const db = await getDatabase();
  // await db.collection('analytics_events').insertOne(event);
}

async function sendToAnalyticsService(event: AnalyticsEvent) {
  // Example: Send to Mixpanel
  // await mixpanel.track(event.type, {
  //   distinct_id: event.sessionId,
  //   ...event.data,
  //   timestamp: event.timestamp,
  // });

  // Example: Send to Amplitude
  // await amplitude.logEvent({
  //   event_type: event.type,
  //   user_id: event.sessionId,
  //   event_properties: event.data,
  //   time: new Date(event.timestamp).getTime(),
  // });
}

async function updateRealTimeMetrics(event: AnalyticsEvent) {
  // Example: Update Redis counters for real-time dashboard
  // const redis = await getRedis();
  // await redis.incr(`events:${event.type}:${getDateKey()}`);
  // await redis.sadd(`sessions:${getDateKey()}`, event.sessionId);
}

function getDateKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}
