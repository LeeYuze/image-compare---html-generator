
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
    title: 'Group 1', 
    urls: [
      'https://picsum.photos/seed/a1/200',
      'https://picsum.photos/seed/a2/200',
    ] 
  },
  { 
    id: 'col-2', 
    title: 'Group 2', 
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
  const [columns, setColumns] = useState<ColumnData[]>(INITIAL_COLUMNS);
  const [config, setConfig] = useState<MatrixConfig>(DEFAULT_CONFIG);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isInputCollapsed, setIsInputCollapsed] = useState<Record<string, boolean>>({});

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('image-column-board-data');
    if (saved) {
      try {
        setColumns(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('image-column-board-data', JSON.stringify(columns));
  }, [columns]);

  const addColumn = () => {
    const newId = `col-${Math.random().toString(36).substr(2, 5)}`;
    setColumns([...columns, { id: newId, title: `New Group ${columns.length + 1}`, urls: [] }]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    if (window.confirm("Delete this entire group?")) {
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

  const toggleInput = (id: string) => {
    setIsInputCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateHTML = (url: string) => {
    if (!url) return '';
    const { previewSize, useTableWrapper } = config;
    const imgTag = `<img src="${url}" height="${previewSize}" width="${previewSize}">`;
    return useTableWrapper ? `<table><tr><td>${imgTag}</td></tr></table>` : imgTag;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
            <h1 className="text-sm font-bold text-slate-800 leading-tight">Image Column Parser</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HTML Generator Board</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Image Size</span>
              <input 
                type="number" 
                className="w-16 px-2 py-0.5 border border-slate-200 rounded text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                value={config.previewSize}
                onChange={e => setConfig({...config, previewSize: parseInt(e.target.value) || 0})}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                checked={config.useTableWrapper}
                onChange={e => setConfig({...config, useTableWrapper: e.target.checked})}
              />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Use Table Wrap</span>
            </label>
          </div>

          <button 
            onClick={addColumn}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={14} /> Add Group
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
                  placeholder="Group Title..."
                />
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => toggleInput(col.id)}
                  title={isInputCollapsed[col.id] ? "Expand Input" : "Collapse Input"}
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
                    placeholder="Paste Image URLs here&#10;One URL per line..."
                    defaultValue={col.urls.join('\n')}
                    onBlur={e => updateColumnUrls(col.id, e.target.value)}
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-indigo-600 rounded text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {col.urls.length} URLs Detected
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Results */}
            <div className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {col.urls.length > 0 ? col.urls.map((url, index) => (
                <div key={`${col.id}-item-${index}`} className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 group/item hover:border-indigo-300 transition-colors">
                  <div className="flex gap-3">
                    {/* Image Preview */}
                    <div className="shrink-0 w-20 h-20 bg-slate-100 rounded-md border border-slate-100 flex items-center justify-center overflow-hidden relative group/img">
                      <img 
                        src={url} 
                        alt={`Img ${index}`} 
                        className="max-h-full max-w-full object-contain transition-transform group-hover/img:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                        }}
                      />
                      <a 
                        href={url} 
                        target="_blank" 
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    {/* Code Section */}
                    <div className="flex-grow flex flex-col justify-between min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">#{index + 1} HTML CODE</span>
                        <button 
                          onClick={() => copyToClipboard(generateHTML(url), `${col.id}-${index}`)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                            copiedId === `${col.id}-${index}` ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                          }`}
                        >
                          {copiedId === `${col.id}-${index}` ? <Check size={10} /> : <Copy size={10} />}
                          {copiedId === `${col.id}-${index}` ? 'DONE' : 'COPY'}
                        </button>
                      </div>
                      <div className="bg-slate-900 rounded-md p-2 text-[10px] font-mono text-indigo-300 line-clamp-3 break-all select-all shadow-inner border border-slate-800 leading-tight">
                        {generateHTML(url)}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40 py-20">
                  <ImageIcon size={48} strokeWidth={1} />
                  <p className="text-xs font-bold mt-2 uppercase tracking-widest">Waiting for URLs</p>
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
          <span className="text-sm font-bold uppercase tracking-tight">New Comparison Group</span>
        </button>
      </main>

      {/* Sticky Bottom Status */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Groups: {columns.length}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Total Images: {columns.reduce((acc, c) => acc + c.urls.length, 0)}
          </span>
        </div>
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Ready for bulk processing
        </p>
      </footer>
    </div>
  );
};

export default App;
