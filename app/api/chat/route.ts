// dify-caption-bot/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client, product, theme, medium, modificationRequest, conversationId, lastCaption } = body;

    // リクエストボディを組み立て
    const difyRequestBody: any = {
      inputs: {},
      query: modificationRequest || "キャプション生成", // 修正指示があればそれをクエリにする
      user: "dify-interactive-user",
      response_mode: "blocking",
      conversation_id: conversationId || null, // 会話IDを引き継ぐ
    };
    
    // Difyの入力（inputs）を設定
    if (modificationRequest) {
      // 修正モードの場合
      difyRequestBody.inputs.modification_request = modificationRequest;
      // Dify側で会話変数を使うので、ここではlastCaptionを渡さない
    } else {
      // 初回生成モードの場合
      difyRequestBody.inputs.user_client = client;
      difyRequestBody.inputs.user_products = product;
      difyRequestBody.inputs.user_theme = theme;
      difyRequestBody.inputs.user_medium = medium;
    }

    const difyResponse = await fetch(`${process.env.DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
      },
      body: JSON.stringify(difyRequestBody),
    });

    const responseData = await difyResponse.json();

    if (!difyResponse.ok) {
      console.error("Dify API Error:", JSON.stringify(responseData, null, 2));
      return NextResponse.json({ error: 'Dify API Error', details: responseData }, { status: difyResponse.status });
    }

    // Difyからの応答から会話IDを抽出
    const newConversationId = responseData.conversation_id;

    let result;
    try {
      // Difyの応答(answer)はJSON形式の文字列なので、それをパース
      const parsedAnswer = JSON.parse(responseData.answer);
      result = {
          client, medium, product,
          initialCaption: parsedAnswer.initial_draft || "N/A",
          pharmaCheck: parsedAnswer.pharma_check || "N/A",
          adCheck: parsedAnswer.ad_check || "N/A",
          finalCaption: parsedAnswer.final_draft || "結果なし",
      };
    } catch (e) {
      // JSONパースに失敗した場合（修正後の単純なテキスト応答など）
      result = {
          finalCaption: responseData.answer,
          // 修正時は他の項目は更新しない
          client, medium, product, initialCaption: lastCaption,
          pharmaCheck: "修正後は未チェック", adCheck: "修正後は未チェック"
      };
    }

    // フロントエンドに会話IDも一緒に返す
    return NextResponse.json({ data: result, conversationId: newConversationId });

  } catch (error) {
    console.error("Server-side Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}