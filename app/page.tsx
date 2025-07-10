"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Send, Edit, FileText, Sparkles, RefreshCw, MessageSquarePlus, AlertTriangle, ImageUp, XCircle, PlusCircle, ShieldCheck, CheckCircle } from "lucide-react"

// --- 型定義 ---
interface ChatMessage {
  id: string;
  type: "user" | "bot" | "result" | "error";
  content: string;
  timestamp: Date;
  data?: any;
  isLoading?: boolean;
}

interface FormData {
  user_client: string;
  user_products: string;
  user_theme: string;
  user_medium: string;
  caption_tone: string;
  user_file: File[];
  modification_request: string;
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

// --- 結果表示コンポーネント ---
function CaptionResultDisplay({ result, onModifyClick }: { result: any; onModifyClick: () => void }) {
  // Difyから返却される可能性のある様々な形式の文字列を安全にパース
  const safeParse = (text: string, key: string) => {
    try {
      if (typeof text !== 'string' || !text.includes(key)) return text;
      const jsonString = text.substring(text.indexOf('{'));
      const parsed = JSON.parse(jsonString);
      return parsed[key] || text;
    } catch {
      return text;
    }
  };

  const initial_draft = result['▼初稿'] || result.initial_draft || "初稿なし";
  const pharma_check = result['▼薬機法チェック結果'] || result.pharma_check || "薬機法チェック結果なし";
  const ad_check = result['▼景表法チェック結果'] || result.ad_check || "景表法チェック結果なし";
  const final_draft = result['▼修正稿'] || result.final_draft || "修正稿なし";

  return (
    <div className="space-y-4 w-full">
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-800"><Sparkles className="w-5 h-5" />最終キャプション案</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap text-gray-800">{final_draft}</p>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-600"><ShieldCheck className="w-5 h-5 text-blue-500" />薬機法チェック</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs whitespace-pre-wrap text-gray-600">{pharma_check}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-600"><CheckCircle className="w-5 h-5 text-green-500" />景表法チェック</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs whitespace-pre-wrap text-gray-600">{ad_check}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-50">
         <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-gray-500"><FileText className="w-5 h-5" />（参考）AIによる初稿</CardTitle>
          </CardHeader>
        <CardContent>
           <p className="text-xs whitespace-pre-wrap text-gray-500">{initial_draft}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={onModifyClick} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
          <Edit className="w-4 h-4 mr-2" />
          この内容で修正する
        </Button>
      </div>
    </div>
  )
}


export default function DifyCaptionBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [pasteStatus, setPasteStatus] = useState<string>('');

  const initialFormData: FormData = {
      user_client: "", user_products: "", user_theme: "",
      user_medium: "", caption_tone: "", modification_request: "",
      user_file: []
  }
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const clientOptions = ["ロート製薬", "トランシーノ", "matsukiyo", "ケープ", "ウエルシア", "ファンケル", "ファンケルダイエット", "ロクシタン", "トワニー", "瞬足", "トラフル", "ハウス家族育", "ロイズ", "ライオンペット", "ミノン" ];
  const mediumOptions = ["X", "Instagram", "TikTok", "LINE"];

  useEffect(() => { startNewChat() }, [])

  const startNewChat = () => {
    setMessages([{ id: "start-1", type: "bot", content: "キャプション生成ボットへようこそ！\n下のフォームからSNS投稿用のキャプションを生成してください。", timestamp: new Date() }])
    setConversationId(null)
    setFormData(initialFormData)
    setShowForm(true)
  }

  const handleFormChange = (field: keyof FormData, value: string | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async () => {
    const { user_client, user_products, user_theme, user_medium, caption_tone } = formData;
    if (!user_client || !user_products || !user_theme || !user_medium || !caption_tone) {
      alert("すべての必須項目を入力してください。");
      return;
    }
    const query = `クライアント「${user_client}」の製品「${user_products}」について、媒体「${user_medium}」、雰囲気「${caption_tone}」でキャプションをテーマ「${user_theme}」で作成してください。`;
    await executeDifyInteraction(query, { ...formData, modification_request: '' });
  }

  const handleModificationSubmit = async () => {
      if (!formData.modification_request.trim()) { alert("修正内容を入力してください。"); return; }
      if (!conversationId) { alert("エラー: 会話が開始されていません。"); return; }
      const query = `以下のキャプションを修正してください: ${formData.modification_request}`;
      await executeDifyInteraction(query, { ...formData });
  }

  const executeDifyInteraction = async (query: string, inputs: Partial<FormData>) => {
    setIsLoading(true);
    setShowForm(false);

    const userMessage: ChatMessage = {
      id: Date.now().toString(), type: "user", content: query, timestamp: new Date(),
    };
    
    const botPlaceholderId = `bot-${Date.now()}`;
    const botPlaceholderMessage: ChatMessage = {
        id: botPlaceholderId, type: 'bot', content: 'キャプションを生成中...', timestamp: new Date(), isLoading: true
    };
    setMessages((prev) => [...prev, userMessage, botPlaceholderMessage]);

    const updateBotMessage = (id: string, newContent: Partial<ChatMessage>) => {
        setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, ...newContent } : msg));
    };

    try {
      const finalInputs: Record<string, any> = { ...inputs };
      delete finalInputs.user_file;

      if (formData.user_file.length > 0) {
        updateBotMessage(botPlaceholderId, { content: `ファイルをアップロード中...`});
        
        const uploadedFileIds: string[] = [];
        for (const file of formData.user_file) {
            const formDataForUpload = new FormData();
            formDataForUpload.append('file', file);
            const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formDataForUpload });

            if (!uploadResponse.ok) throw new Error(`「${file.name}」のアップロードに失敗`);
            const result = await uploadResponse.json();
            uploadedFileIds.push(result.id);
        }
        finalInputs.user_file = uploadedFileIds;
      }
      
      await sendMessageToDify(finalInputs, query, botPlaceholderId, updateBotMessage);

    } catch (error) {
        if (error instanceof Error) {
          updateBotMessage(botPlaceholderId, { type: 'error', content: error.message, isLoading: false });
        }
        setIsLoading(false);
    }
  }

  const sendMessageToDify = async (
      inputs: Record<string, any>, 
      query: string, 
      botPlaceholderId: string, 
      updateBotMessage: (id: string, newContent: Partial<ChatMessage>) => void
  ) => {
    let finalAnswer: string = '';
    let finalConversationId: string | undefined = undefined;

    try {
        updateBotMessage(botPlaceholderId, { content: 'キャプションを生成中...', isLoading: true });
        
        const response = await fetch('/api/dify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs, query, user: "dify-caption-bot-user", response_mode: "streaming", conversation_id: conversationId }),
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            throw new Error(`APIリクエストに失敗 (Status: ${response.status}): ${errorText}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: false });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim().startsWith("data:")) {
                    const jsonData = line.trim().substring(5);
                    if (!jsonData) continue;
                    try {
                        const json = JSON.parse(jsonData);
                        
                        if (json.conversation_id) finalConversationId = json.conversation_id;
                        
                        if (json.event === 'workflow_finished' && json.data?.outputs?.answer) {
                            finalAnswer = json.data.outputs.answer;
                        }
                    } catch (e) { /* ignore */ }
                }
            }
        }
        
        if (finalConversationId) setConversationId(finalConversationId);

        if (finalAnswer.trim()) {
            const parsedResult = {};
            const sections = finalAnswer.split('▼');
            sections.forEach(section => {
              if (section.trim()) {
                const [title, ...content] = section.split('\n');
                // @ts-ignore
                parsedResult[`▼${title.trim()}`] = content.join('\n').trim();
              }
            });
            updateBotMessage(botPlaceholderId, { type: 'result', content: '', data: parsedResult, isLoading: false });
        } else {
            throw new Error(`Difyからの応答が空か、期待する形式ではありませんでした。\n会話ID: ${finalConversationId || '取得失敗'}`);
        }

    } catch (error) {
        if (error instanceof Error) {
            updateBotMessage(botPlaceholderId, { type: 'error', content: error.message, isLoading: false });
        }
    } finally {
        setIsLoading(false);
        handleFormChange('modification_request', '');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFormChange('user_file', [...formData.user_file, ...Array.from(files)]);
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
      handleFormChange('user_file', [...formData.user_file, imageFile]);
      setPasteStatus(`画像をペーストしました: ${imageFile.name}`);
      setTimeout(() => setPasteStatus(''), 3000);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    handleFormChange('user_file', formData.user_file.filter(file => file !== fileToRemove));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4"><div className="p-3 bg-emerald-600 rounded-full"><Sparkles className="w-8 h-8 text-white" /></div><h1 className="text-3xl font-bold text-emerald-900">キャプション生成ボット</h1></div>
            <p className="text-emerald-700 text-lg">SNS投稿用キャプションを自動生成・法的チェック付き</p>
          </div>
          <Card className="shadow-2xl border-emerald-200 bg-white/90 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />チャット</CardTitle>
              <Button variant="ghost" size="icon" onClick={startNewChat} className="text-white hover:bg-white/20"><RefreshCw className="w-5 h-5" /></Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-lg break-words ${
                              message.type === "user" ? "bg-emerald-600 text-white" :
                              message.type === "result" ? "bg-transparent w-full" :
                              message.type === "error" ? "bg-red-50 border border-red-200 w-full" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                            {message.isLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                                  <span className="text-sm text-gray-600 whitespace-pre-wrap">{message.content}</span>
                                </div>
                            ) : message.type === "error" ? <ErrorDisplay message={message.content} /> :
                               message.type === 'result' && message.data ? <CaptionResultDisplay result={message.data} onModifyClick={() => {setShowForm(false);}} /> :
                             <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            }
                             <p className="text-xs opacity-70 mt-2 text-right">{message.timestamp.toLocaleTimeString()}</p>
                          </div>
                      </div>
                  ))}
              </div>
              {showForm && !isLoading && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardHeader><CardTitle className="text-emerald-800 flex items-center gap-2"><Edit className="w-5 h-5" />キャプション生成フォーム</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="user_client" className="text-emerald-700 font-medium">クライアント名 *</Label>
                        <Select value={formData.user_client} onValueChange={(value) => handleFormChange('user_client', value)}>
                          <SelectTrigger className="border-emerald-300 focus:border-emerald-500"><SelectValue placeholder="クライアントを選択" /></SelectTrigger>
                          <SelectContent>{clientOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="user_medium" className="text-emerald-700 font-medium">媒体 *</Label>
                        <Select value={formData.user_medium} onValueChange={(value) => handleFormChange('user_medium', value)}>
                          <SelectTrigger className="border-emerald-300 focus:border-emerald-500"><SelectValue placeholder="媒体を選択" /></SelectTrigger>
                          <SelectContent>{mediumOptions.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                        <Label htmlFor="caption_tone" className="text-emerald-700 font-medium">キャプションの雰囲気 *</Label>
                        <Textarea id="caption_tone" value={formData.caption_tone} onChange={(e) => handleFormChange('caption_tone', e.target.value)} placeholder="例: 若者向けに、フレンドリーで少しユーモアを交えた感じ" className="border-emerald-300 focus:border-emerald-500 min-h-[60px]" />
                    </div>
                    <div>
                      <Label htmlFor="user_products" className="text-emerald-700 font-medium">商品名・サービス名 *</Label>
                      <Input id="user_products" value={formData.user_products} onChange={(e) => handleFormChange('user_products', e.target.value)} placeholder="例: スーパービタミンC美容液" className="border-emerald-300 focus:border-emerald-500" />
                    </div>
                    <div>
                      <Label htmlFor="user_theme" className="text-emerald-700 font-medium">投稿のテーマ *</Label>
                      <Textarea id="user_theme" value={formData.user_theme} onChange={(e) => handleFormChange('user_theme', e.target.value)} placeholder="どんな投稿にしたいか、テーマや目的を詳しく入力してください。" className="border-emerald-300 focus:border-emerald-500 min-h-[100px]" />
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
              {!isLoading && conversationId && (
                <div className="mt-4 space-y-2">
                   <Label htmlFor="modification_request" className="text-emerald-700 font-medium">修正依頼</Label>
                   <Textarea id="modification_request" value={formData.modification_request} onChange={(e) => handleFormChange('modification_request', e.target.value)} placeholder="生成されたキャプションへの修正点を具体的に入力してください。" className="border-emerald-300 focus:border-emerald-500"/>
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