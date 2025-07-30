import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook event for debugging
    console.log('Farcaster webhook received:', body);
    
    // Handle different types of webhook events
    switch (body.type) {
      case 'frame_added':
        console.log('Frame added by user:', body.data);
        break;
      case 'frame_removed':
        console.log('Frame removed by user:', body.data);
        break;
      case 'notification_clicked':
        console.log('Notification clicked:', body.data);
        break;
      default:
        console.log('Unknown webhook type:', body.type);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Lub Match webhook endpoint',
    status: 'active' 
  });
}
