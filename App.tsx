
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Image as ImageIcon,
  ExternalLink,
  Settings2,
  Columns as ColumnsIcon,
  Type,
  LayoutDashboard,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ColumnData, MatrixConfig } from './types';

const INITIAL_COLUMNS: ColumnData[] = [
  {
    id: 'col-1',
    title: '分组 1',
    urls: [
      'https://picsum.photos/seed/a1/200',
      'https://picsum.photos/seed/a2/200',
    ]
  },
  {
    id: 'col-2',
    title: '分组 2',
    urls: [
      'https://picsum.photos/seed/b1/200',
      'https://picsum.photos/seed/b2/200',
    ]
  }
];

const DEFAULT_CONFIG: MatrixConfig = {
  previewSize: 100,
  useTableWrapper: true,
};

const App: React.FC = () => {
  const [columns, setColumns] = useState<ColumnData[]>(() => {
    const saved = localStorage.getItem('image-column-board-data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_COLUMNS;
  });
  const [config, setConfig] = useState<MatrixConfig>(DEFAULT_CONFIG);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isInputCollapsed, setIsInputCollapsed] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; columnId: string; index: number } | null>(null);

  // Persistence - 只需要保存，不需要加载（已在 useState 中处理）
  useEffect(() => {
    localStorage.setItem('image-column-board-data', JSON.stringify(columns));
  }, [columns]);

  const addColumn = () => {
    const newId = `col-${Math.random().toString(36).substr(2, 5)}`;
    setColumns([...columns, { id: newId, title: `新分组 ${columns.length + 1}`, urls: [] }]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    if (window.confirm("确定要删除整个分组吗？")) {
      setColumns(columns.filter(c => c.id !== id));
    }
  };

  const updateColumnTitle = (id: string, title: string) => {
    setColumns(columns.map(c => c.id === id ? { ...c, title } : c));
  };

  const updateColumnUrls = (id: string, urlsString: string) => {
    const urls = urlsString.split('\n').map(u => u.trim()).filter(u => u !== '');
    setColumns(columns.map(c => c.id === id ? { ...c, urls } : c));
  };

  const removeUrl = (columnId: string, urlIndex: number) => {
    setColumns(columns.map(c => {
      if (c.id === columnId) {
        return { ...c, urls: c.urls.filter((_, index) => index !== urlIndex) };
      }
      return c;
    }));
  };

  const updateUrl = (columnId: string, urlIndex: number, newUrl: string) => {
    setColumns(columns.map(c => {
      if (c.id === columnId) {
        const newUrls = [...c.urls];
        newUrls[urlIndex] = newUrl;
        return { ...c, urls: newUrls };
      }
      return c;
    }));
  };

  const insertUrl = (columnId: string, urlIndex: number, position: 'above' | 'below') => {
    setColumns(columns.map(c => {
      if (c.id === columnId) {
        const newUrls = [...c.urls];
        const insertIndex = position === 'above' ? urlIndex : urlIndex + 1;
        newUrls.splice(insertIndex, 0, '');
        return { ...c, urls: newUrls };
      }
      return c;
    }));
  };

  const toggleInput = (id: string) => {
    setIsInputCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewImage) return;

    const column = columns.find(c => c.id === previewImage.columnId);
    if (!column) return;

    let newIndex = previewImage.index;
    if (direction === 'prev') {
      newIndex = previewImage.index > 0 ? previewImage.index - 1 : column.urls.length - 1;
    } else {
      newIndex = previewImage.index < column.urls.length - 1 ? previewImage.index + 1 : 0;
    }

    setPreviewImage({
      url: column.urls[newIndex],
      columnId: previewImage.columnId,
      index: newIndex
    });
  };

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewImage) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePreview('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigatePreview('next');
      } else if (e.key === 'Escape') {
        setPreviewImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, columns]);

  const generateHTML = (url: string) => {
    if (!url) return '';
    const { previewSize, useTableWrapper } = config;
    const imgTag = `<img src="${url}" height="${previewSize}" width="${previewSize}">`;
    return useTableWrapper ? `<table><tr><td>${imgTag}</td></tr></table>` : imgTag;
  };

  const copyToClipboard = (text: string, id: string) => {
    // 兼容 IE 和旧浏览器的复制方法
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // 现代浏览器使用 Clipboard API
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(() => {
          // 如果 Clipboard API 失败，降级到传统方法
          fallbackCopyToClipboard(text, id);
        });
    } else {
      // IE 和旧浏览器使用传统方法
      fallbackCopyToClipboard(text, id);
    }
  };

  const fallbackCopyToClipboard = (text: string, id: string) => {
    // 创建临时 textarea 元素
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      // 使用 execCommand 复制（兼容 IE）
      const successful = document.execCommand('copy');
      if (successful) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }

    document.body.removeChild(textarea);
  };

  return (
    <div className="h-screen bg-slate-100 text-slate-900 flex flex-col overflow-hidden font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-indigo-100 shadow-lg">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">图片管理工具</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">图片对比与管理面板</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={addColumn}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={14} /> 添加分组
          </button>
        </div>
      </header>

      {/* Board Layout */}
      <main className="flex-grow flex p-6 gap-6 overflow-x-auto custom-scrollbar items-start">
        {columns.map((col) => (
          <div 
            key={col.id} 
            className="flex-shrink-0 w-80 md:w-96 flex flex-col h-full bg-slate-200/50 rounded-xl border border-slate-300 shadow-sm overflow-hidden"
          >
            {/* Column Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 flex-grow overflow-hidden mr-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <input
                  type="text"
                  value={col.title}
                  onChange={e => updateColumnTitle(col.id, e.target.value)}
                  className="w-full text-sm font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 outline-none truncate"
                  placeholder="分组标题..."
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleInput(col.id)}
                  title={isInputCollapsed[col.id] ? "展开输入框" : "收起输入框"}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                >
                  {isInputCollapsed[col.id] ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button
                  onClick={() => removeColumn(col.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Input Section */}
            {!isInputCollapsed[col.id] && (
              <div className="p-3 bg-white border-b border-slate-200 shrink-0">
                <div className="relative group">
                  <textarea
                    className="w-full h-32 p-3 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none custom-scrollbar"
                    placeholder="在此粘贴图片URL&#10;每行一个URL..."
                    value={col.urls.join('\n')}
                    onChange={e => updateColumnUrls(col.id, e.target.value)}
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-indigo-600 rounded text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    已检测到 {col.urls.length} 个URL
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Results */}
            <div className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {col.urls.length > 0 ? col.urls.map((url, index) => (
                <div key={`${col.id}-item-${index}`} className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 group/item hover:border-indigo-300 transition-colors">
                  {/* Image URL Display */}
                  <div className="mb-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">#{index + 1} 图片地址</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => insertUrl(col.id, index, 'above')}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="在上方插入空项"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          上插
                        </button>
                        <button
                          onClick={() => insertUrl(col.id, index, 'below')}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="在下方插入空项"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          下插
                        </button>
                        <button
                          onClick={() => copyToClipboard(url, `${col.id}-${index}-url`)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            copiedId === `${col.id}-${index}-url` ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          }`}
                        >
                          {copiedId === `${col.id}-${index}-url` ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === `${col.id}-${index}-url` ? '已复制' : '复制地址'}
                        </button>
                        <button
                          onClick={() => removeUrl(col.id, index)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={12} />
                          删除
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => updateUrl(col.id, index, e.target.value)}
                      className="w-full bg-slate-50 rounded-md p-2 text-[10px] font-mono text-slate-600 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="输入图片URL..."
                    />
                  </div>

                  {/* Image Preview */}
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-md border border-slate-100 flex items-center justify-center overflow-hidden relative group/img">
                      <img
                        src={url}
                        alt={`Img ${index}`}
                        className="max-h-full max-w-full object-contain transition-transform group-hover/img:scale-110"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                        }}
                      />
                      <button
                        onClick={() => setPreviewImage({ url, columnId: col.id, index })}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white cursor-pointer"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40 py-20">
                  <ImageIcon size={48} strokeWidth={1} />
                  <p className="text-xs font-bold mt-2 uppercase tracking-widest">等待添加URL</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Column Button */}
        <button
          onClick={addColumn}
          className="flex-shrink-0 w-80 h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-white transition-all gap-2"
        >
          <Plus size={32} strokeWidth={1.5} />
          <span className="text-sm font-bold uppercase tracking-tight">新建对比分组</span>
        </button>
      </main>

      {/* Sticky Bottom Status */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            分组数: {columns.length}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            图片总数: {columns.reduce((acc: number, c: ColumnData) => acc + c.urls.length, 0)}
          </span>
        </div>
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          准备批量处理
        </p>
      </footer>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[100]"
          onClick={() => setPreviewImage(null)}
        >
          {/* 关闭按钮 - 浏览器右上角 */}
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-8 right-8 text-white hover:text-red-400 transition-colors z-20"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 主内容区 - 左箭头、图片、右箭头 */}
          <div className="h-full flex items-center justify-between px-8">
            {/* 左箭头 - 浏览器左侧 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigatePreview('prev');
              }}
              className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all backdrop-blur-sm z-10 flex-shrink-0"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 图片容器 */}
            <div className="relative flex-1 flex items-center justify-center">
              <img
                src={previewImage.url}
                alt="预览"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />

              {/* 图片信息 */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                {previewImage.index + 1} / {columns.find(c => c.id === previewImage.columnId)?.urls.length || 0}
              </div>
            </div>

            {/* 右箭头 - 浏览器右侧 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigatePreview('next');
              }}
              className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all backdrop-blur-sm z-10 flex-shrink-0"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
