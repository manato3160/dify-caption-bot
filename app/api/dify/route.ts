import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const difyApiUrl = `${process.env.DIFY_API_URL}/chat-messages`;
  const difyApiKey = process.env.DIFY_API_KEY;

  if (!difyApiUrl || !difyApiKey) {
    return NextResponse.json(
      { error: 'API URL or Key is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const response = await fetch(difyApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.body) {
      return NextResponse.json(
        { error: 'No response body from Dify API' },
        { status: 500 }
      );
    }

    // Difyからのストリーミングレスポンスをクライアントに中継
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          controller.enqueue(value);
        }
        controller.close();
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error proxying to Dify API:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Dify API' },
      { status: 500 }
    );
  }
} 