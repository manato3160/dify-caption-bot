"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, Send, CheckCircle, Edit, FileText, Sparkles, RefreshCw, MessageSquarePlus, AlertTriangle, ImageUp, XCircle, PlusCircle } from "lucide-react"

// --- 型定義 ---
interface DifyMessage {
  id: string
  conversation_id: string
  answer: string
  created_at: number
}
interface ChatMessage {
  id: string
  type: "user" | "bot" | "result" | "error"
  content: string
  timestamp: Date
  data?: any
}
interface CaptionResult {
  initial_draft: string
  pharma_check: string
  ad_check: string
  final_draft: string
}
interface FormData {
  user_client: string
  user_products: string
  user_theme: string
  user_medium: string
  caption_tone: string 
  user_file: File[]
}

// --- エラー表示用コンポーネント ---
const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="space-y-2 text-destructive">
        <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <p>エラーが発生しました</p>
        </div>
        <p className="text-xs whitespace-pre-wrap">{message}</p>
    </div>
);


export default function DifyCaptionBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [modificationRequest, setModificationRequest] = useState("")
  const [showModificationInput, setShowModificationInput] = useState(false)
  const [pasteStatus, setPasteStatus] = useState<string>('');
  const [isResultShown, setIsResultShown] = useState(false);

  const initialFormData: FormData = {
      user_client: "", user_products: "", user_theme: "",
      user_medium: "", caption_tone: "",
      user_file: []
  }
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const clientOptions = ["ロート製薬", "トランシーノ", "matsukiyo", "ケープ", "ウエルシア", "ファンケル", "ファンケルダイエット", "ロクシタン", "トワニー", "瞬足", "トラフル", "ハウス家族育", "ロイズ", "ライオンペット", "ミノン" ];
  const mediumOptions = ["X", "Instagram", "TikTok", "LINE"];

  useEffect(() => { startNewChat() }, [])

  const startNewChat = () => {
    setMessages([{ id: "start-1", type: "bot", content: "キャプション生成ボットへようこそ！\n下のボタンからSNS投稿用のキャプションを生成いたします。", timestamp: new Date() }])
    setConversationId(null)
    setFormData(initialFormData)
    setShowForm(false)
    setShowModificationInput(false)
    setIsResultShown(false);
  }

  const handleFormSubmit = async () => {
    const { user_client, user_products, user_theme, user_medium, caption_tone, user_file } = formData;
    if (!user_client || !user_products || !user_theme || !user_medium || !caption_tone) {
      alert("すべての必須項目を入力してください。");
      return;
    }
    
    setIsLoading(true);
    setShowForm(false);
    setShowModificationInput(false);
    setIsResultShown(false);

    const query = `クライアント「${user_client}」の製品「${user_products}」について、媒体「${user_medium}」、雰囲気「${caption_tone}」でキャプションをテーマ「${user_theme}」で作成してください。`;

    const userMessage: ChatMessage = {
      id: Date.now().toString(), type: "user", content: query, timestamp: new Date(),
    };
    
    const botPlaceholderId = `bot-${Date.now()}`;
    const botPlaceholderMessage: ChatMessage = {
        id: botPlaceholderId, type: 'bot', content: '', timestamp: new Date(), data: { isLoading: true }
    };
    setMessages((prev) => [...prev, userMessage, botPlaceholderMessage]);

    const updatePlaceholderWithMessage = (type: ChatMessage['type'], content: string, data?: any) => {
        const newMessage: ChatMessage = { id: botPlaceholderId, type, content, timestamp: new Date(), data };
        setMessages(prev => prev.map(msg => msg.id === botPlaceholderId ? newMessage : msg));
    };

    try {
      const inputs: Record<string, any> = { user_client, user_products, user_theme, user_medium, caption_tone };

      if (user_file.length > 0) {
        updatePlaceholderWithMessage("bot", `ファイルをアップロード中... (1/${user_file.length})`);
        
        const uploadedFileIds: string[] = [];
        for (let i = 0; i < user_file.length; i++) {
            const file = user_file[i];
            updatePlaceholderWithMessage("bot", `ファイルをアップロード中... (${i + 1}/${user_file.length})`);
            const formDataForUpload = new FormData();
            formDataForUpload.append('file', file);

            const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formDataForUpload });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`「${file.name}」のアップロードに失敗しました: ${errorText}`);
            }
            const result = await uploadResponse.json();
            uploadedFileIds.push(result.id);
        }
        
        inputs.user_file = uploadedFileIds;
      }

      await sendMessageToDify(inputs, query, botPlaceholderId, updatePlaceholderWithMessage);

    } catch (error) {
        if (error instanceof Error) updatePlaceholderWithMessage("error", error.message);
        setIsLoading(false);
    }
  };

  const sendMessageToDify = async (
      inputs: Record<string, any>, 
      query: string, 
      botPlaceholderId: string, 
      updatePlaceholderWithMessage: (type: ChatMessage['type'], content: string, data?: any) => void
  ) => {
    let finalAnswer: string | undefined = undefined;
    let finalConversationId: string | undefined = undefined;

    try {
        updatePlaceholderWithMessage("bot", "", { isLoading: true });
        
        const response = await fetch('/api/dify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs, query, user: "dify-caption-bot-user", response_mode: "streaming", conversation_id: conversationId }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`APIリクエストに失敗しました (Status: ${response.status}): ${errorBody}`);
        }
        if (!response.body) throw new Error("レスポンスボディが存在しません。");
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim().startsWith("data:")) {
                    const jsonData = line.trim().substring(5);
                    if (!jsonData) continue;
                    try {
                        const json = JSON.parse(jsonData);
                        if (typeof json.answer === 'string' && json.answer.trim()) finalAnswer = json.answer;
                        if (json.conversation_id) finalConversationId = json.conversation_id;
                    } catch (e) { /* JSON parsing error is ignored */ }
                }
            }
        }

        if (finalConversationId) setConversationId(finalConversationId);

        if (typeof finalAnswer === 'string') {
            try {
                const outerJson = JSON.parse(finalAnswer);
                 if (typeof outerJson === 'object' && outerJson !== null && 'result' in outerJson && typeof outerJson.result === 'string') {
                    const resultJson = JSON.parse(outerJson.result);
                    updatePlaceholderWithMessage("result", "キャプションが生成されました。", resultJson);
                } else {
                    updatePlaceholderWithMessage("result", "キャプションが生成されました。", outerJson);
                }
                setIsResultShown(true);
            } catch (e) {
                updatePlaceholderWithMessage("bot", finalAnswer);
            }
        } else {
            throw new Error("Difyからのストリームに応答が含まれていませんでした。ワークフローのログを確認してください。");
        }
    } catch (error) {
        if (error instanceof Error) updatePlaceholderWithMessage("error", error.message);
    } finally {
        setIsLoading(false);
    }
  };


  const handleModificationSubmit = async () => {
    if (!modificationRequest.trim()) { alert("修正内容を入力してください。"); return; }
    if (!conversationId) { alert("エラー: 会話が開始されていません。"); return; }
    const inputs = { modification_request: modificationRequest };
    await handleFormSubmit(); // Re-use the main submit logic
    setModificationRequest("");
  }
  
  const handleModifyClick = () => {
      setShowModificationInput(true);
      const modifyMessage: ChatMessage = { id: Date.now().toString(), type: "bot", content: "修正したい内容を下の入力欄に入力して送信してください。", timestamp: new Date() }
      setMessages((prev) => [...prev, modifyMessage])
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFormData((prev) => ({ ...prev, user_file: [...prev.user_file, ...Array.from(files)] }));
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData.items;
    let imageFile: File | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }
    if (imageFile) {
      event.preventDefault();
      setFormData((prev) => ({ ...prev, user_file: [...prev.user_file, imageFile!] }));
      setPasteStatus(`画像をペーストしました: ${imageFile.name}`);
      setTimeout(() => setPasteStatus(''), 3000);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFormData(prev => ({ ...prev, user_file: prev.user_file.filter(file => file !== fileToRemove) }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4"><div className="p-3 bg-emerald-600 rounded-full"><Sparkles className="w-8 h-8 text-white" /></div><h1 className="text-3xl font-bold text-emerald-900">キャプション生成ボット</h1></div>
            <p className="text-emerald-700 text-lg">SNS投稿用キャプションを自動生成・法的チェック付き</p>
          </div>
          {/* Card */}
          <Card className="shadow-2xl border-emerald-200 bg-white/90 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />チャット</CardTitle>
              <Button variant="ghost" size="icon" onClick={startNewChat} className="text-white hover:bg-white/20"><RefreshCw className="w-5 h-5" /></Button>
            </CardHeader>
            <CardContent className="p-6">
              {/* Chat Messages */}
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                {messages.map((message) => {
                  if (message.data?.isLoading) {
                      return (
                          <div key={message.id} className="flex justify-start">
                              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                                  <span className="text-sm text-gray-600">キャプションを生成中...</span>
                                </div>
                              </div>
                          </div>
                      )
                  }
                  
                  return (
                      <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg break-words ${
                              message.type === "user" ? "bg-emerald-600 text-white" :
                              message.type === "result" ? "bg-green-50 border border-green-200 w-full" :
                              message.type === "error" ? "bg-red-50 border border-red-200 w-full" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                            {message.type === "result" && message.data ? <CaptionResultDisplay result={message.data} onModifyClick={handleModifyClick} /> :
                             message.type === "error" ? <ErrorDisplay message={message.content} /> :
                             <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            }
                             <p className="text-xs opacity-70 mt-2 text-right">{message.timestamp.toLocaleTimeString()}</p>
                          </div>
                      </div>
                  )
                })}
              </div>
              {/* Conditional Buttons and Form */}
              {messages.length === 1 && !showForm && (
                 <Button onClick={() => setShowForm(true)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    キャプション生成を開始する
                 </Button>
              )}
              {isResultShown && !isLoading && !showModificationInput && (
                <Button onClick={startNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  新規作成
                </Button>
              )}
              {showForm && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardHeader><CardTitle className="text-emerald-800 flex items-center gap-2"><Edit className="w-5 h-5" />キャプション生成フォーム</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="user_client" className="text-emerald-700 font-medium">クライアント名 *</Label>
                        <Select value={formData.user_client} onValueChange={(value) => setFormData((prev) => ({ ...prev, user_client: value }))}>
                          <SelectTrigger className="border-emerald-300 focus:border-emerald-500"><SelectValue placeholder="クライアントを選択" /></SelectTrigger>
                          <SelectContent>{clientOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="user_medium" className="text-emerald-700 font-medium">媒体 *</Label>
                        <Select value={formData.user_medium} onValueChange={(value) => setFormData((prev) => ({ ...prev, user_medium: value }))}>
                          <SelectTrigger className="border-emerald-300 focus:border-emerald-500"><SelectValue placeholder="媒体を選択" /></SelectTrigger>
                          <SelectContent>{mediumOptions.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                        <Label htmlFor="caption_tone" className="text-emerald-700 font-medium">キャプションの雰囲気 *</Label>
                        <Textarea id="caption_tone" value={formData.caption_tone} onChange={(e) => setFormData((prev) => ({ ...prev, caption_tone: e.target.value }))} placeholder="例: 若者向けに、フレンドリーで少しユーモアを交えた感じ" className="border-emerald-300 focus:border-emerald-500 min-h-[60px]" />
                    </div>
                    <div>
                      <Label htmlFor="user_products" className="text-emerald-700 font-medium">商品名・サービス名 *</Label>
                      <Input id="user_products" value={formData.user_products} onChange={(e) => setFormData((prev) => ({ ...prev, user_products: e.target.value }))} placeholder="例: スーパービタミンC美容液" className="border-emerald-300 focus:border-emerald-500" />
                    </div>
                    <div>
                      <Label htmlFor="user_theme" className="text-emerald-700 font-medium">投稿のテーマ *</Label>
                      <Textarea id="user_theme" value={formData.user_theme} onChange={(e) => setFormData((prev) => ({ ...prev, user_theme: e.target.value }))} placeholder="どんな投稿にしたいか、テーマや目的を詳しく入力してください。" className="border-emerald-300 focus:border-emerald-500 min-h-[100px]" />
                    </div>
                    <div>
                      <Label htmlFor="user_file" className="text-emerald-700 font-medium">参考資料（任意）</Label>
                      <div onPaste={handlePaste} className="relative mt-1">
                          <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-emerald-300 rounded-lg text-center cursor-pointer hover:border-emerald-500 transition-colors">
                            <ImageUp className="mx-auto h-12 w-12 text-gray-400" />
                            <label htmlFor="user_file_input" className="relative cursor-pointer rounded-md font-semibold text-emerald-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 hover:text-emerald-500">
                                <span>ファイルを選択</span>
                                <input id="user_file_input" name="user_file_input" type="file" className="sr-only" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" multiple />
                            </label>
                            <p className="pl-1">するか、ここにドラッグ＆ドロップ</p>
                            <p className="text-xs leading-5 text-gray-600">または、画像をコピーしてこのエリアにペーストしてください</p>
                            {pasteStatus && (<p className="text-sm font-semibold text-green-600 mt-2">{pasteStatus}</p>)}
                          </div>
                          {formData.user_file.length > 0 && (
                            <div className="mt-2 space-y-2">
                                <h4 className="text-sm font-medium">添付ファイル一覧:</h4>
                                <ul className="divide-y divide-emerald-200 rounded-md border border-emerald-200">
                                    {formData.user_file.map((file, index) => (
                                      <li key={index} className="flex items-center justify-between py-1.5 px-2 text-sm">
                                        <span className="truncate pr-2">{file.name}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(file)}>
                                          <XCircle className="h-4 w-4 text-gray-500 hover:text-destructive"/>
                                        </Button>
                                      </li>
                                    ))}
                                </ul>
                            </div>
                          )}
                      </div>
                    </div>
                    <Button onClick={handleFormSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3" disabled={isLoading}>
                      <Send className="w-4 h-4 mr-2" />
                      キャプション生成
                    </Button>
                  </CardContent>
                </Card>
              )}
              {showModificationInput && (
                <div className="mt-4 space-y-2">
                   <Label htmlFor="modification_request" className="text-emerald-700 font-medium">修正内容</Label>
                   <Textarea id="modification_request" value={modificationRequest} onChange={(e) => setModificationRequest(e.target.value)} placeholder="修正したい点を具体的に入力してください。" className="border-emerald-300 focus:border-emerald-500"/>
                   <Button onClick={handleModificationSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                     <Send className="w-4 h-4 mr-2" />
                     修正依頼を送信
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CaptionResultDisplay({ result, onModifyClick }: { result: CaptionResult; onModifyClick: () => void }) {
  const parseCheckResult = (checkText: string) => {
    if (typeof checkText !== 'string') return { status: "データ不正", details: "予期せぬ形式のデータです。" };
    if (checkText.includes("問題なし")) return { status: "問題なし", details: "" };
    if (checkText.includes("要確認")) {
        const parts = checkText.split('指摘された表現と理由：');
        return { status: "要確認", details: parts[1] ? parts[1].trim() : "" };
    }
    return { status: "不明", details: checkText };
  };
  const pharmaCheck = parseCheckResult(result.pharma_check);
  const adCheck = parseCheckResult(result.ad_check);
  return (
    <div className="space-y-4 w-full max-w-none">
      <h3 className="font-bold text-emerald-800 text-base">キャプションが生成されました</h3>
      <Separator className="bg-emerald-200" />
      <div>
        <p className="font-medium text-emerald-700 text-sm mb-2">✅ 最終キャプション案</p>
        <div className="bg-white p-3 rounded border border-emerald-200"><p className="text-sm whitespace-pre-wrap">{result.final_draft}</p></div>
      </div>
      <div className="space-y-2">
          <p className="font-medium text-emerald-700 text-sm">コンプライアンスチェック結果</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded border ${pharmaCheck.status === '問題なし' ? 'bg-green-100 border-green-300' : 'bg-yellow-100 border-yellow-300'}`}>
                <div className="flex items-center gap-1 font-semibold">
                    <CheckCircle className={`w-4 h-4 ${pharmaCheck.status === '問題なし' ? 'text-green-600' : 'text-yellow-600'}`} />
                    <span className={`${pharmaCheck.status === '問題なし' ? 'text-green-800' : 'text-yellow-800'}`}>薬機法/商標/炎上: {pharmaCheck.status}</span>
                </div>
                {pharmaCheck.details && <p className="mt-1 pl-5 text-yellow-900 whitespace-pre-wrap">{pharmaCheck.details}</p>}
            </div>
             <div className={`p-2 rounded border ${adCheck.status === '問題なし' ? 'bg-green-100 border-green-300' : 'bg-yellow-100 border-yellow-300'}`}>
                <div className="flex items-center gap-1 font-semibold">
                    <CheckCircle className={`w-4 h-4 ${adCheck.status === '問題なし' ? 'text-green-600' : 'text-yellow-600'}`} />
                     <span className={`${adCheck.status === '問題なし' ? 'text-green-800' : 'text-yellow-800'}`}>景表法/商標/炎上: {adCheck.status}</span>
                </div>
                 {adCheck.details && <p className="mt-1 pl-5 text-yellow-900 whitespace-pre-wrap">{adCheck.details}</p>}
            </div>
          </div>
       </div>
      <div>
        <p className="font-medium text-gray-500 text-sm mb-2">📝 (参考) 初期キャプション案</p>
        <div className="bg-gray-50 p-3 rounded border border-gray-200"><p className="text-sm whitespace-pre-wrap text-gray-600">{result.initial_draft}</p></div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={onModifyClick} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
          <Edit className="w-4 h-4 mr-2" />
          この内容で修正する
        </Button>
      </div>
    </div>
  )
}