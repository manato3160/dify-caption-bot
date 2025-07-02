"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, Send, CheckCircle, Edit, FileText, Sparkles } from "lucide-react"

interface ChatMessage {
  id: string
  type: "user" | "bot" | "form" | "result"
  content: string
  timestamp: Date
  data?: any
}

interface CaptionResult {
  client: string
  medium: string
  product: string
  initialCaption: string
  complianceCheck: {
    pharmaceutical: string
    advertising: string
  }
  finalCaption: string
}

export default function DifyCaptionBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "bot",
      content: "キャプション生成ボットへようこそ！SNS投稿用のキャプションを生成いたします。",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [currentResult, setCurrentResult] = useState<CaptionResult | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    client: "",
    product: "",
    theme: "",
    medium: "",
    file: null as File | null,
  })

  const clientOptions = [
    "ロート製薬",
    "トランシーノ",
    "matsukiyo",
    "ケープ",
    "ウエルシア",
    "ファンケル",
    "ファンケルダイエット",
    "ロクシタン",
    "トワニー",
    "瞬足",
    "トラフル",
    "ハウス家族育",
    "ロイズ",
    "ライオンペット",
    "ミノン",
  ]

  const mediumOptions = ["X", "Instagram", "TikTok", "LINE"]

  const handleFormSubmit = async () => {
    if (!formData.client || !formData.product || !formData.theme || !formData.medium) {
      return
    }

    setIsLoading(true)
    setShowForm(false)

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: `キャプション生成を開始します。\nクライアント: ${formData.client}\n商品: ${formData.product}\n媒体: ${formData.medium}`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate processing
    setTimeout(() => {
      const result: CaptionResult = {
        client: formData.client,
        medium: formData.medium,
        product: formData.product,
        initialCaption: generateSampleCaption(formData.medium, formData.product, formData.theme),
        complianceCheck: {
          pharmaceutical: "問題なし",
          advertising: "問題なし",
        },
        finalCaption: generateSampleCaption(formData.medium, formData.product, formData.theme),
      }

      const resultMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "result",
        content: "キャプションが生成されました。",
        timestamp: new Date(),
        data: result,
      }

      setMessages((prev) => [...prev, resultMessage])
      setCurrentResult(result)
      setIsLoading(false)
    }, 3000)
  }

  const generateSampleCaption = (medium: string, product: string, theme: string) => {
    const captions = {
      X: `${theme}について考えてみました✨\n\n${product}を使って実感したのは、毎日の小さな変化の積み重ねの大切さ。\n\n継続は力なり💪\n\n#${product} #日常 #継続`,
      Instagram: `${theme} 🌟\n\n${product}との出会いで、毎日がもっと輝いて見えるようになりました✨\n\n小さな変化も、積み重ねれば大きな違いに。\n皆さんはどんな小さな変化を大切にしていますか？\n\nコメントで教えてくださいね💕\n\n#${product} #日常の変化 #輝く毎日 #小さな幸せ #継続は力なり`,
      TikTok: `${product}で変わった私の日常！✨\n\n${theme}がテーマの今回、リアルな変化をお見せします👀\n\n#${product} #日常 #変化`,
      LINE: `こんにちは！😊\n\n${theme}についてのお話です。\n\n${product}を使い始めてから、毎日の生活に小さな変化が生まれています。\n\n詳しくはこちらをチェック👇\n[詳細を見る]`,
    }
    return captions[medium as keyof typeof captions] || captions["X"]
  }

  const handleAction = (action: "ok" | "modify") => {
    if (action === "ok") {
      const thankYouMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: "ありがとうございました！\n新規でキャプション作成したい場合は新しいチャットで開始してね！",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, thankYouMessage])
    } else {
      const modifyMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: "修正したい内容を教えてください。",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, modifyMessage])
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, file }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-emerald-600 rounded-full">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-emerald-900">キャプション生成ボット</h1>
            </div>
            <p className="text-emerald-700 text-lg">SNS投稿用キャプションを自動生成・法的チェック付き</p>
          </div>

          {/* Chat Container */}
          <Card className="shadow-2xl border-emerald-200 bg-white/90 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                チャット
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Messages */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.type === "user"
                          ? "bg-emerald-600 text-white"
                          : message.type === "result"
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.type === "result" && message.data ? (
                        <CaptionResultDisplay result={message.data} onAction={handleAction} />
                      ) : (
                        <p className="whitespace-pre-line text-sm">{message.content}</p>
                      )}
                      <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        <span className="text-sm text-gray-600">キャプションを生成中...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form */}
              {showForm && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      キャプション生成フォーム
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="client" className="text-emerald-700 font-medium">
                          クライアント名
                        </Label>
                        <Select
                          value={formData.client}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, client: value }))}
                        >
                          <SelectTrigger className="border-emerald-300 focus:border-emerald-500">
                            <SelectValue placeholder="クライアントを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientOptions.map((client) => (
                              <SelectItem key={client} value={client}>
                                {client}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="medium" className="text-emerald-700 font-medium">
                          媒体
                        </Label>
                        <Select
                          value={formData.medium}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, medium: value }))}
                        >
                          <SelectTrigger className="border-emerald-300 focus:border-emerald-500">
                            <SelectValue placeholder="媒体を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {mediumOptions.map((medium) => (
                              <SelectItem key={medium} value={medium}>
                                {medium}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="product" className="text-emerald-700 font-medium">
                        商品名・サービス名
                      </Label>
                      <Input
                        id="product"
                        value={formData.product}
                        onChange={(e) => setFormData((prev) => ({ ...prev, product: e.target.value }))}
                        placeholder="商品名またはサービス名を入力"
                        className="border-emerald-300 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="theme" className="text-emerald-700 font-medium">
                        投稿テーマ
                      </Label>
                      <Textarea
                        id="theme"
                        value={formData.theme}
                        onChange={(e) => setFormData((prev) => ({ ...prev, theme: e.target.value }))}
                        placeholder="投稿のテーマを詳しく入力してください"
                        className="border-emerald-300 focus:border-emerald-500 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="file" className="text-emerald-700 font-medium">
                        参考資料（任意）
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="file"
                          type="file"
                          onChange={handleFileUpload}
                          accept="image/*,.pdf,.doc,.docx"
                          className="border-emerald-300 focus:border-emerald-500"
                        />
                        <Upload className="w-5 h-5 text-emerald-600" />
                      </div>
                      {formData.file && (
                        <p className="text-sm text-emerald-600 mt-1">選択されたファイル: {formData.file.name}</p>
                      )}
                    </div>

                    <Button
                      onClick={handleFormSubmit}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3"
                      disabled={!formData.client || !formData.product || !formData.theme || !formData.medium}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      キャプション生成
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!showForm && !isLoading && (
                <Button
                  onClick={() => {
                    setShowForm(true)
                    setMessages([
                      {
                        id: "1",
                        type: "bot",
                        content: "キャプション生成ボットへようこそ！SNS投稿用のキャプションを生成いたします。",
                        timestamp: new Date(),
                      },
                    ])
                    setCurrentResult(null)
                    setFormData({
                      client: "",
                      product: "",
                      theme: "",
                      medium: "",
                      file: null,
                    })
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  新しいキャプションを生成
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CaptionResultDisplay({
  result,
  onAction,
}: { result: CaptionResult; onAction: (action: "ok" | "modify") => void }) {
  return (
    <div className="space-y-4 w-full max-w-none">
      <h3 className="font-bold text-emerald-800 text-base">キャプションが生成されました</h3>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
            {result.client}
          </Badge>
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            {result.medium}
          </Badge>
        </div>

        <div>
          <p className="font-medium text-emerald-700 text-sm mb-1">商品名・サービス名</p>
          <p className="text-sm text-gray-700">{result.product}</p>
        </div>

        <Separator className="bg-emerald-200" />

        <div>
          <p className="font-medium text-emerald-700 text-sm mb-2">生成されたキャプション</p>
          <div className="bg-white p-3 rounded border border-emerald-200">
            <p className="text-sm whitespace-pre-line">{result.finalCaption}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700">薬機法: {result.complianceCheck.pharmaceutical}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700">景表法: {result.complianceCheck.advertising}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => onAction("ok")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
          >
            OK
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("modify")}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex-1"
          >
            修正
          </Button>
        </div>
      </div>
    </div>
  )
}
