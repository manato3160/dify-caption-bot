"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, Send, Edit, FileText, Sparkles, AlertTriangle, CheckCircle, MessageSquare, CornerDownLeft } from "lucide-react"

// --- インターフェース定義 ---
interface ChatMessage {
  id: string; type: "user" | "bot" | "result"; content: string;
  timestamp: Date; data?: any;
}
interface CaptionResult {
  client: string; medium: string; product: string; initialCaption: string;
  pharmaCheck: any; adCheck: any; finalCaption: string;
}

// --- メインのページコンポーネント ---
export default function DifyCaptionBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [showModificationInput, setShowModificationInput] = useState(false);
  const [modificationText, setModificationText] = useState("");
  const [currentResult, setCurrentResult] = useState<CaptionResult | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初回メッセージの設定
    if (messages.length === 0) {
      setMessages([{
        id: "1", type: "bot", content: "キャプション生成ボットへようこそ！SNS投稿用のキャプションを生成いたします。",
        timestamp: new Date(),
      }]);
    }
    // チャットが更新されたら一番下にスクロール
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const [formData, setFormData] = useState({
    client: "", product: "", theme: "", medium: "",
  });

  const clientOptions = ["ロート製薬", "トランシーノ", "matsukiyo", "ケープ", "ウエルシア", "ファンケル", "ロクシタン", "トワニー", "ミノン"];
  const mediumOptions = ["X", "Instagram", "TikTok", "LINE"];

  // --- API通信処理 ---
  const callApi = async (requestBody: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.details?.message || `API Error: ${response.status}`);
      
      setCurrentResult(responseData.data);
      setConversationId(responseData.conversationId); // 会話IDを更新
      setMessages((prev) => [...prev, {
        id: Date.now().toString(), type: "result", content: "結果",
        timestamp: new Date(), data: responseData.data,
      }]);

    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), type: 'bot', content: `エラーが発生しました: ${error.message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ハンドラ関数 ---
  const handleFormSubmit = async () => {
    setShowForm(false);
    const userMessage = `キャプション生成を開始します。\nクライアント: ${formData.client}\n商品: ${formData.product}\n媒体: ${formData.medium}`;
    setMessages((prev) => [...prev, { id: Date.now().toString(), type: "user", content: userMessage, timestamp: new Date() }]);
    await callApi(formData);
  };

  const handleModificationSubmit = async () => {
    if (!modificationText.trim()) return;
    setShowModificationInput(false);
    setMessages((prev) => [...prev, { id: Date.now().toString(), type: "user", content: modificationText, timestamp: new Date() }]);
    await callApi({
      modificationRequest: modificationText,
      conversationId: conversationId,
      // Difyの会話変数で管理するため、前回のキャプションは送らない
      // lastCaption: currentResult?.finalCaption, 
      // 修正時も元のコンテキストを渡す
      client: currentResult?.client,
      medium: currentResult?.medium,
      product: currentResult?.product,
    });
    setModificationText("");
  };
  
  const handleAction = (action: "ok" | "modify") => {
    if (action === "ok") {
      setShowModificationInput(false);
      setMessages((prev) => [...prev, { id: Date.now().toString(), type: "bot", content: "ありがとうございました！\n新規でキャプション作成したい場合は「新しいキャプションを生成」ボタンを押してください。", timestamp: new Date() }]);
    } else {
      setShowModificationInput(true);
    }
  };

  const startNewChat = () => {
    setShowForm(true);
    setMessages([]); // メッセージをリセット
    setCurrentResult(null);
    setConversationId(null);
    setFormData({ client: "", product: "", theme: "", medium: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-emerald-600 rounded-full"><Sparkles className="w-8 h-8 text-white" /></div>
            <h1 className="text-4xl font-bold text-emerald-900">キャプション生成ボット</h1>
          </div>
          <p className="text-emerald-700 text-lg">SNS投稿用キャプションを自動生成・法的チェック付き</p>
        </div>
        <Card className="shadow-2xl border-emerald-200 bg-white/90 backdrop-blur-sm h-[80vh] flex flex-col">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg flex-shrink-0">
            <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />チャット</CardTitle>
          </CardHeader>
          <CardContent ref={chatContainerRef} className="p-6 flex-grow overflow-y-auto space-y-4">
            {messages.map((msg) => ( /* ここにチャットメッセージの表示ロジック */
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-full rounded-lg px-4 py-3 ${msg.type === 'result' ? 'w-full bg-green-50 border border-green-200' : msg.type === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {msg.type === 'result' && msg.data ? <CaptionResultDisplay result={msg.data} onAction={handleAction} /> : <p className="whitespace-pre-line text-sm">{msg.content}</p>}
                  <p className="text-xs opacity-70 mt-2 text-right">{msg.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="bg-gray-100 px-4 py-3 rounded-lg flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div><span className="text-sm text-gray-600">生成中...</span></div></div>}
          </CardContent>
          <div className="p-4 border-t bg-white/50 rounded-b-lg flex-shrink-0">
            {showModificationInput ? ( /* 修正入力欄 */
              <div className="flex gap-2">
                <Input value={modificationText} onChange={(e) => setModificationText(e.target.value)} placeholder="修正内容を具体的に入力してください..." onKeyDown={(e) => e.key === 'Enter' && handleModificationSubmit()} autoFocus />
                <Button onClick={handleModificationSubmit}><Send size={16} /></Button>
              </div>
            ) : showForm ? ( /* 初回フォーム */
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pt-4 pb-2"><CardTitle className="text-lg text-emerald-800 flex items-center gap-2"><Edit size={18} />キャプション生成フォーム</CardTitle></CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>クライアント名</Label><Select value={formData.client} onValueChange={(v) => setFormData(p => ({...p, client:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{clientOptions.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>媒体</Label><Select value={formData.medium} onValueChange={(v) => setFormData(p => ({...p, medium:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{mediumOptions.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div><Label>商品名・サービス名</Label><Input value={formData.product} onChange={(e) => setFormData(p => ({...p, product:e.target.value}))}/></div>
                  <div><Label>投稿テーマ</Label><Textarea value={formData.theme} onChange={(e) => setFormData(p => ({...p, theme:e.target.value}))} className="min-h-[80px]"/></div>
                  <Button onClick={handleFormSubmit} className="w-full" disabled={!formData.client||!formData.product||!formData.theme||!formData.medium}><Send size={16}/>キャプション生成</Button>
                </CardContent>
              </Card>
            ) : ( /* 新規チャットボタン */
              <Button onClick={startNewChat} className="w-full">新しいキャプションを生成</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

// --- 結果表示用のサブコンポーネント ---
function CaptionResultDisplay({ result, onAction }: { result: CaptionResult; onAction: (action: "ok" | "modify") => void }) {
  const ResultCard = ({ title, content, icon }: { title: string; content: any; icon: React.ReactNode }) => {
    const renderContent = () => {
      if (typeof content === 'string') return <div className="text-sm text-gray-700 space-y-2">{content.split('\n').map((line, i) => <p key={i} className="break-words">{line || <span className="h-4 block"/>}</p>)}</div>;
      if (typeof content === 'object' && content?.result) {
        return <div className="space-y-3"><Badge variant={!content.result.includes("要確認") ? "default" : "destructive"}>{content.result}</Badge>{content.issues?.length > 0 && <div className="space-y-3 pt-2">{content.issues.map((issue: any, i: number) => <div key={i} className="p-3 bg-red-50/50 rounded-lg border border-red-200 text-xs"><p className="font-semibold text-red-800">指摘箇所:「{issue.text}」</p><p className="mt-1"><strong>理由:</strong>{issue.reason}</p><p className="mt-1 text-gray-500"><strong>根拠:</strong>{issue.basis}</p></div>)}</div>}</div>;
      }
      return <pre className="text-xs whitespace-pre-wrap break-words bg-gray-100 p-2 rounded-md">{JSON.stringify(content, null, 2)}</pre>;
    };
    return <Card className="bg-white/70"><CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-emerald-800 flex items-center gap-2">{icon}{title}</CardTitle></CardHeader><CardContent>{renderContent()}</CardContent></Card>;
  };
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-2 items-center">
        <h3 className="font-bold text-emerald-900 text-lg">キャプション生成結果</h3>
        <Badge variant="outline" className="border-emerald-400 text-emerald-800 bg-emerald-100">{result.client}</Badge>
        <Badge variant="outline" className="border-blue-400 text-blue-800 bg-blue-100">{result.medium}</Badge>
        <Badge variant="secondary">{result.product}</Badge>
      </div>
      <Separator/>
      <div className="space-y-4">
        <ResultCard title="初稿" content={result.initialCaption} icon={<FileText size={18}/>}/>
        <ResultCard title="薬機法チェック結果" content={result.pharmaCheck} icon={<AlertTriangle size={18}/>}/>
        <ResultCard title="景表法チェック結果" content={result.adCheck} icon={<AlertTriangle size={18}/>}/>
        <ResultCard title="修正稿" content={result.finalCaption} icon={<CheckCircle size={18}/>}/>
      </div>
      <div className="flex gap-2 pt-4">
        <Button size="sm" onClick={() => onAction("ok")} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">OK</Button>
        <Button size="sm" variant="outline" onClick={() => onAction("modify")} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex-1">修正</Button>
      </div>
    </div>
  )
}