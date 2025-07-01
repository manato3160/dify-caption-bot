# Dify Caption Bot

SNS投稿用キャプションを自動生成するNext.jsアプリケーションです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Dify API設定
# DifyのチャットAPIのエンドポイントURL
DIFY_API_URL=https://your-dify-instance.com/v1/chat-messages

# DifyのAPIキー
DIFY_API_KEY=your-dify-api-key-here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## API エンドポイント

### POST /api/chat

キャプション生成のリクエストを処理します。

#### リクエストボディ

```json
{
  "client": "ロート製薬",
  "product": "商品名",
  "theme": "テーマ",
  "medium": "X"
}
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    // Difyからのレスポンスデータ
  }
}
```

## 使用方法

1. アプリケーションにアクセス
2. クライアント名、商品名、テーマ、媒体を選択
3. フォームを送信
4. Dify APIを使用してキャプションを生成
5. 生成されたキャプションを確認・修正

## 技術スタック

- Next.js 14
- TypeScript
- Tailwind CSS
- Dify API 