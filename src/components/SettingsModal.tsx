import React, { useState } from 'react';
import { AppSettings, Topic, NoteEntry } from '../types';
import { syncNotesToLocalDisk } from '../utils/storage';
import { setAmbientSound } from '../utils/audio';
import { 
  X, 
  Folder, 
  Lock, 
  Volume2, 
  FileText, 
  Save, 
  Check, 
  Sparkles,
  HardDrive
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  topics: Topic[];
  notes: NoteEntry[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  topics,
  notes,
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'privacy' | 'sound' | 'templates'>('vault');
  const [vaultPath, setVaultPath] = useState(settings.customVaultPath || '');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Privacy lock states
  const [isLockEnabled, setIsLockEnabled] = useState(settings.isLockEnabled || false);
  const [pinCode, setPinCode] = useState(settings.pinCode || '');

  // Sound states
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled || false);
  const [whiteNoise, setWhiteNoise] = useState(settings.whiteNoise || 'none');

  // Templates
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id || 'reading');
  const [templateContent, setTemplateContent] = useState(
    settings.templates[topics[0]?.id || 'reading'] || ''
  );

  if (!isOpen) return null;

  const handleSelectDirectory = async () => {
    if (window.electronAPI?.selectDirectory) {
      const selected = await window.electronAPI.selectDirectory();
      if (selected) {
        setVaultPath(selected);
      }
    } else {
      // Browser fallback prompt
      const manual = prompt('请输入本地文件夹绝对路径 (例如 D:\\MyNotes):', vaultPath);
      if (manual) {
        setVaultPath(manual);
      }
    }
  };

  const handleSyncToDisk = async () => {
    if (!vaultPath.trim()) {
      alert('请先选择或输入本地数据存放文件夹！');
      return;
    }
    setSyncStatus('正在同步 Markdown 文件到本地磁盘...');
    const res = await syncNotesToLocalDisk(vaultPath, notes, topics);
    if (res.success) {
      setSyncStatus(`同步成功！已在本地生成 ${res.count} 个标准 .md 文件。`);
      setTimeout(() => setSyncStatus(null), 3000);
    } else {
      setSyncStatus(`同步失败: ${res.error}`);
    }
  };

  const handleSaveAll = () => {
    const updatedSettings: AppSettings = {
      ...settings,
      customVaultPath: vaultPath,
      isLockEnabled,
      pinCode,
      soundEnabled,
      whiteNoise,
      templates: {
        ...settings.templates,
        [selectedTopicId]: templateContent,
      },
    };
    onUpdateSettings(updatedSettings);
    setAmbientSound(whiteNoise);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-panel border border-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="font-bold text-sm text-main font-serif">ChronoNote 偏好设置</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-main"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-card/60 border-b border-border text-xs">
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'vault' ? 'bg-violet-600 text-white shadow-xs' : 'text-muted hover:text-main'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>本地存储目录</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'privacy' ? 'bg-violet-600 text-white shadow-xs' : 'text-muted hover:text-main'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>私密密码锁</span>
          </button>

          <button
            onClick={() => setActiveTab('sound')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'sound' ? 'bg-violet-600 text-white shadow-xs' : 'text-muted hover:text-main'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>打字音效与白噪音</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'templates' ? 'bg-violet-600 text-white shadow-xs' : 'text-muted hover:text-main'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>主题模板定制</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: Vault / Local Storage Folder */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-main mb-1">自定义本地 Markdown 存储文件夹</h4>
                <p className="text-muted leading-relaxed">
                  你可以绑定电脑上的任意目录（例如 OneDrive、坚果云同步盘、或现有知识库）。软件将按照 <code className="text-violet-400">年/月/日期_标题.md</code> 的规范双向存取。
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-muted block">当前绑定的文件夹路径：</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={vaultPath}
                    onChange={(e) => setVaultPath(e.target.value)}
                    placeholder="尚未绑定目录 (例如 C:\Users\MyNotes)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-card border border-border text-main font-mono text-xs focus:outline-none focus:border-violet-500"
                  />
                  <button
                    onClick={handleSelectDirectory}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-card-hover text-main font-medium shrink-0 transition-colors"
                  >
                    <Folder className="w-3.5 h-3.5 text-violet-400" />
                    <span>浏览文件夹...</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/50 border border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-main">实时存盘与全库同步</div>
                  <div className="text-muted text-[11px] mt-0.5">将软件中的全部 {notes.length} 篇随笔立即写入该磁盘文件夹。</div>
                </div>
                <button
                  onClick={handleSyncToDisk}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-xs transition-colors shrink-0"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>立即同步到磁盘</span>
                </button>
              </div>

              {syncStatus && (
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-xs animate-fade-in">
                  {syncStatus}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Privacy Lock */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-main mb-1">私密日记密码锁</h4>
                <p className="text-muted leading-relaxed">
                  为你的私人随笔提供隐私防护。开启后，启动应用或离开时将需要输入 PIN 码验证。
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                <div>
                  <div className="font-semibold text-main">启用独立访问密码</div>
                  <div className="text-muted text-[11px]">开启后将在每次冷启动或手动锁屏时验证</div>
                </div>
                <input
                  type="checkbox"
                  checked={isLockEnabled}
                  onChange={(e) => setIsLockEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                />
              </div>

              {isLockEnabled && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-muted block">设置 4~8 位数字或字符 PIN 码：</label>
                  <input
                    type="password"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="输入解锁密码..."
                    className="w-full max-w-xs px-3.5 py-2.5 rounded-xl bg-card border border-border text-main text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Sound & Atmosphere */}
          {activeTab === 'sound' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-main mb-1">沉浸式打字音效与白噪音</h4>
                <p className="text-muted leading-relaxed">
                  通过程序化音频合成引擎实现，无需加载外部音频文件，离线即开即享。
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
                <div>
                  <div className="font-semibold text-main">机械键盘 / 打字机敲击音效</div>
                  <div className="text-muted text-[11px]">打字时发出清脆有声的物理微动反馈</div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                <div className="font-semibold text-main">背景环境白噪音</div>
                <div className="flex items-center gap-2 pt-1">
                  {[
                    { id: 'none', label: '静音关闭' },
                    { id: 'rain', label: '🌧️ 窗外细雨声' },
                    { id: 'fire', label: '🔥 壁炉柴火声' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setWhiteNoise(item.id as 'none' | 'rain' | 'fire');
                        setAmbientSound(item.id as 'none' | 'rain' | 'fire');
                      }}
                      className={`px-3 py-1.5 rounded-xl border transition-all ${
                        whiteNoise === item.id
                          ? 'bg-violet-600 text-white border-violet-500'
                          : 'bg-panel text-muted hover:text-main border-border'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Templates */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-main mb-1">主题专属智能写作模板</h4>
                <p className="text-muted leading-relaxed">
                  选择主题后定制其新建时的默认 Markdown 模板。
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {topics.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTopicId(t.id);
                      setTemplateContent(settings.templates[t.id] || '');
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                      selectedTopicId === t.id
                        ? 'bg-violet-600 text-white font-semibold'
                        : 'bg-card text-muted hover:text-main border border-border'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  rows={9}
                  className="w-full p-4 rounded-xl bg-card border border-border text-main font-mono text-xs leading-relaxed focus:outline-none focus:border-violet-500"
                  placeholder="在此编辑该主题的默认 Markdown 骨架模板..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-card border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-muted hover:text-main transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存偏好配置</span>
          </button>
        </div>
      </div>
    </div>
  );
};
