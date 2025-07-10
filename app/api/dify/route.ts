import { NextRequest, NextResponse } from 'next/server';

// 実行環境をNode.jsに固定し、キャッシュを無効化します
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const difyResponse = await fetch(difyApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // @ts-ignore - Node.js v18+ で安定したストリーミングに必要
      duplex: 'half'
    });
    
    // Difyからのレスポンスをそのままブラウザに返すのが最も確実です
    return difyResponse;

  } catch (error) {
    console.error('Error proxying to Dify API:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Dify API' },
      { status: 500 }
    );
  }
}