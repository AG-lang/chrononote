import React, { useState } from 'react';
import { NoteEntry, Topic, AiSettings } from '../types';
import { renderMarkdown } from '../utils/markdown';
import { getTodayDateString } from '../utils/dateUtils';
import { 
  Sparkles, 
  X, 
  Cpu, 
  RefreshCw, 
  Send, 
  Copy, 
  Check, 
  BookmarkPlus, 
  AlertCircle 
} from 'lucide-react';

interface AiDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteEntry[];
  topics: Topic[];
  aiSettings: AiSettings;
  onUpdateAiSettings: (newSettings: AiSettings) => void;
  onSaveAsNote: (date: string, topicId: string, title: string, content: string) => void;
}

export const AiDigestModal: React.FC<AiDigestModalProps> = ({
  isOpen,
  onClose,
  notes,
  topics,
  aiSettings,
  onUpdateAiSettings,
  onSaveAsNote,
}) => {
  const [provider, setProvider] = useState<'ollama' | 'openai'>(aiSettings.provider || 'ollama');
  const [baseUrl, setBaseUrl] = useState(aiSettings.baseUrl || 'http://localhost:11434');
  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [model, setModel] = useState(aiSettings.model || '');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [timeScope, setTimeScope] = useState<'week' | 'month' | 'year'>('month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [digestResult, setDigestResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1-Click Fetch Models
  const handleFetchModels = async () => {
    setFetchingModels(true);
    setFetchMsg(null);
    try {
      const cleanBase = baseUrl.replace(/\/+$/, '');
      if (provider === 'ollama') {
        const res = await fetch(`${cleanBase}/api/tags`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        const list = (data.models || []).map((m: { name: string }) => m.name);
        setAvailableModels(list);
        if (list.length > 0) {
          setModel(list[0]);
          setFetchMsg({ text: `成功获取到本地 ${list.length} 个模型！`, isError: false });
        } else {
          setFetchMsg({ text: '已连接 Ollama，但未检测到已拉取的模型 (可执行 ollama run qwen2.5)', isError: true });
        }
      } else {
        // OpenAI / DeepSeek compatible
        const endpoint = cleanBase.endsWith('/v1') ? `${cleanBase}/models` : `${cleanBase}/v1/models`;
        const res = await fetch(endpoint, {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        const list = (data.data || []).map((m: { id: string }) => m.id);
        setAvailableModels(list);
        if (list.length > 0) {
          setModel(list[0]);
          setFetchMsg({ text: `成功获取到 ${list.length} 个模型！`, isError: false });
        } else {
          setFetchMsg({ text: '未能解析到模型列表', isError: true });
        }
      }
      onUpdateAiSettings({ provider, baseUrl, apiKey, model });
    } catch (err) {
      console.error('Fetch models error:', err);
      setFetchMsg({
        text: `连接失败: 请确认本地 Ollama/端点已启动且支持跨域或 URL 正确 (${String(err)})`,
        isError: true,
      });
    } finally {
      setFetchingModels(false);
    }
  };

  // Generate Digest
  const handleGenerateDigest = async () => {
    if (!model) {
      alert('请先一键获取或输入模型名称！');
      return;
    }

    setIsGenerating(true);
    setDigestResult('');

    // Filter notes based on scope
    const now = new Date();
    const filtered = notes.filter(n => {
      const noteDate = new Date(n.date);
      if (timeScope === 'week') {
        return (now.getTime() - noteDate.getTime()) <= 7 * 86400000;
      } else if (timeScope === 'month') {
        return (now.getTime() - noteDate.getTime()) <= 31 * 86400000;
      } else {
        return noteDate.getFullYear() === now.getFullYear();
      }
    });

    if (filtered.length === 0) {
      setDigestResult('> 所选时间周期内暂无随笔内容，快去记录几篇再来生成吧！');
      setIsGenerating(false);
      return;
    }

    const topicsMap = new Map(topics.map(t => [t.id, t.name]));
    const notesSummary = filtered.map(n => {
      return `【日期：${n.date}】【主题：${topicsMap.get(n.topicId) || '随笔'}】标题：${n.title}\n内容节选：${n.content.slice(0, 300)}`;
    }).join('\n\n---\n\n');

    const prompt = `你是一位温柔、深刻且充满人文关怀的个人思维导师与生活复盘顾问。以下是用户在过去一段时间内记录的真实生活随笔与读书思考：\n\n${notesSummary}\n\n请你为用户生成一份具有洞察力的系统性复盘长文小结，请包含以下结构：\n1. 【时空纵览】：总结这段时间内思想的核心主线与认知变化\n2. 【认知与顿悟】：提炼最具启发性的概念或心得\n3. 【情绪与生活温度】：关怀用户的心境起伏与生活节奏\n4. 【行动建议与寄语】：给予 2~3 条轻盈且有力量的行动建议。\n请采用排版优美优雅的 Markdown 格式输出。`;

    try {
      const cleanBase = baseUrl.replace(/\/+$/, '');
      if (provider === 'ollama') {
        const res = await fetch(`${cleanBase}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
          }),
        });
        const data = await res.json();
        setDigestResult(data.response || '生成完毕，无输出');
      } else {
        const endpoint = cleanBase.endsWith('/v1') ? `${cleanBase}/chat/completions` : `${cleanBase}/v1/chat/completions`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: apiKey ? `Bearer ${apiKey}` : '',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const data = await res.json();
        setDigestResult(data.choices?.[0]?.message?.content || '生成完毕');
      }
    } catch (err) {
      console.error('AI generate error:', err);
      setDigestResult(`> ⚠️ 生成中断: ${String(err)}\n\n请检查模型服务地址与网络连通性。`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToReviewNote = () => {
    if (!digestResult) return;
    const today = getTodayDateString();
    onSaveAsNote(
      today,
      'review',
      `AI 时光复盘小结 · ${timeScope === 'week' ? '本周' : timeScope === 'month' ? '本月' : '年度'}`,
      digestResult
    );
    alert('已成功将 AI 小结沉淀为今日【复盘精进】随笔！');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel border border-border rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-main font-serif">AI 时光小结与脉络沉淀</h3>
              <p className="text-[11px] text-muted">支持本地 Ollama 私有大模型与 OpenAI/DeepSeek 兼容端点</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-main"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* API Config Box */}
          <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-main">模型服务提供方：</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setProvider('ollama');
                      setBaseUrl('http://localhost:11434');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      provider === 'ollama'
                        ? 'bg-violet-600 text-white font-semibold'
                        : 'bg-panel text-muted hover:text-main border border-border'
                    }`}
                  >
                    🦙 Ollama (本地私有)
                  </button>
                  <button
                    onClick={() => {
                      setProvider('openai');
                      setBaseUrl('https://api.deepseek.com');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      provider === 'openai'
                        ? 'bg-violet-600 text-white font-semibold'
                        : 'bg-panel text-muted hover:text-main border border-border'
                    }`}
                  >
                    ⚡ DeepSeek / OpenAI
                  </button>
                </div>
              </div>

              {/* 1-Click Fetch Models Button */}
              <button
                onClick={handleFetchModels}
                disabled={fetchingModels}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border border-violet-500/30 font-medium transition-all shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                <span>{fetchingModels ? '正在连接获取...' : '一键获取模型列表'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-muted block mb-1">服务端点 Base URL</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="如 http://localhost:11434"
                  className="w-full px-3 py-2 rounded-xl bg-panel border border-border text-main font-mono text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {provider === 'openai' && (
                <div>
                  <label className="text-muted block mb-1">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 rounded-xl bg-panel border border-border text-main font-mono text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              <div>
                <label className="text-muted block mb-1">当前使用模型</label>
                {availableModels.length > 0 ? (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-panel border border-border text-main font-mono text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="可点击右上角一键获取，或手动输入 (如 qwen2.5:latest)"
                    className="w-full px-3 py-2 rounded-xl bg-panel border border-border text-main font-mono text-xs focus:outline-none focus:border-violet-500"
                  />
                )}
              </div>
            </div>

            {fetchMsg && (
              <div className={`p-2.5 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 ${
                fetchMsg.isError ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fetchMsg.text}</span>
              </div>
            )}
          </div>

          {/* Trigger Scope & Button */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted">复盘周期：</span>
              {(['week', 'month', 'year'] as const).map(scope => (
                <button
                  key={scope}
                  onClick={() => setTimeScope(scope)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    timeScope === scope
                      ? 'bg-violet-600 text-white font-medium shadow-xs'
                      : 'bg-card text-muted hover:text-main border border-border'
                  }`}
                >
                  {scope === 'week' && '最近一周'}
                  {scope === 'month' && '本月至今'}
                  {scope === 'year' && '今年全年'}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateDigest}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isGenerating ? 'animate-pulse' : ''}`} />
              <span>{isGenerating ? '思考提炼中...' : '开始提炼复盘小结'}</span>
            </button>
          </div>

          {/* Output Window */}
          {digestResult && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <span className="font-semibold text-main text-xs">AI 思考小结提炼报告</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(digestResult);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-panel border border-border text-muted hover:text-main text-[11px] transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '已复制' : '复制全文'}</span>
                  </button>

                  <button
                    onClick={handleSaveToReviewNote}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-violet-600 text-white text-[11px] font-medium shadow-xs hover:bg-violet-500 transition-colors"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                    <span>存为今日复盘随笔</span>
                  </button>
                </div>
              </div>

              <div
                className="markdown-body max-w-none text-xs leading-relaxed font-serif"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(digestResult) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
