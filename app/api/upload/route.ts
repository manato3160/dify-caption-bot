import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const difyApiUrl = `${process.env.DIFY_API_URL}/files/upload`;
  const difyApiKey = process.env.DIFY_API_KEY;

  if (!difyApiUrl || !difyApiKey) {
    return NextResponse.json(
      { error: 'API URL or Key is not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const difyFormData = new FormData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'File not found in request' }, { status: 400 });
    }

    difyFormData.append('file', file);
    difyFormData.append('user', 'dify-caption-bot-user');

    const response = await fetch(difyApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
      },
      body: difyFormData,
    });
    
    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Dify file upload failed:", errorBody);
        return NextResponse.json({ error: 'Dify file upload failed', details: errorBody }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in upload proxy:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 