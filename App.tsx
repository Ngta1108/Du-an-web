
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Zap, Moon, Sun, ZoomIn, ZoomOut, Maximize, ImagePlus, Eye, X, Save } from 'lucide-react';
import { FilterControls } from './components/FilterControls';
import { CanvasEditor } from './components/CanvasEditor';
import { FilterState, DEFAULT_FILTERS, HistogramData, TextLayer, StickerLayer, FrameType, DrawingPath, BrushSettings, DetectedObject } from './types';
import { translations, Language } from './translations';

// Define a complete snapshot of the app state for history
interface HistorySnapshot {
  filters: FilterState;
  textLayers: TextLayer[];
  stickers: StickerLayer[];
  drawingPaths: DrawingPath[];
  layerOrder: {id: string, type: 'text' | 'sticker'}[];
}

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const [viewZoom, setViewZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'text' | 'creative'>('ai');
  const [isDragging, setIsDragging] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  
  // Export Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
      name: 'makebetter-edit',
      format: 'image/png',
      quality: 0.9
  });
  
  // State definitions
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [activeFrame, setActiveFrame] = useState<FrameType>('none');
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [layerOrder, setLayerOrder] = useState<{id: string, type: 'text' | 'sticker'}[]>([]);
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    color: '#ffffff',
    size: 10,
    opacity: 1,
    isEnabled: false
  });
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);

  // History State - Now stores full Snapshots
  const [history, setHistory] = useState<HistorySnapshot[]>([{
      filters: DEFAULT_FILTERS,
      textLayers: [],
      stickers: [],
      drawingPaths: [],
      layerOrder: []
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Crop State
  const [isCropping, setIsCropping] = useState(false);
  const [cropParams, setCropParams] = useState<{ zoom: number; aspect: number | null }>({ zoom: 1, aspect: null });
  const [cropTrigger, setCropTrigger] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  // Sync Dark Mode with HTML root for global styles (scrollbars, etc.)
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- History Management ---
  
  // Helper to push a new snapshot to history
  const pushToHistory = (snapshotOverride?: Partial<HistorySnapshot>) => {
      const currentSnapshot: HistorySnapshot = {
          filters,
          textLayers,
          stickers,
          drawingPaths,
          layerOrder,
          ...snapshotOverride
      };

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentSnapshot);
      
      // Limit history size to 50 steps
      if (newHistory.length > 50) newHistory.shift();
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
  };

  // Called by sliders/filters (only updates filters in snapshot)
  const handleAddToHistory = useCallback(() => {
      // We use a timeout to ensure we capture the latest state after React updates
      // However, for sliders, we often call this explicitly. 
      // To be safe, we construct the snapshot with current state refs if possible, 
      // but since we don't have refs for everything, we rely on the closure or pass updated values.
      
      // Note: This function is usually passed to FilterControls for onMouseUp.
      // At that point, 'filters' state might be stale in this closure if not careful.
      // But since handleAddToHistory is in dependency array of useCallback with [filters], it should be fresh.
      
      pushToHistory();
  }, [filters, textLayers, stickers, drawingPaths, layerOrder, history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const snapshot = history[newIndex];
      
      // Restore all states
      setFilters(snapshot.filters);
      setTextLayers(snapshot.textLayers);
      setStickers(snapshot.stickers);
      setDrawingPaths(snapshot.drawingPaths);
      setLayerOrder(snapshot.layerOrder);
      
      // Reset active selections to avoid ghost edits
      setActiveTextId(null);
      setActiveStickerId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const snapshot = history[newIndex];
      
      setFilters(snapshot.filters);
      setTextLayers(snapshot.textLayers);
      setStickers(snapshot.stickers);
      setDrawingPaths(snapshot.drawingPaths);
      setLayerOrder(snapshot.layerOrder);
    }
  };

  const handleResetAll = () => {
    const emptySnapshot: HistorySnapshot = {
        filters: DEFAULT_FILTERS,
        textLayers: [],
        stickers: [],
        drawingPaths: [],
        layerOrder: []
    };
    
    setFilters(DEFAULT_FILTERS);
    setTextLayers([]);
    setStickers([]);
    setDrawingPaths([]);
    setLayerOrder([]);
    setActiveFrame('none');
    setDetectedObjects([]);
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(emptySnapshot);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleRemoveImage = () => {
    setImageSrc(null);
    const emptySnapshot: HistorySnapshot = {
        filters: DEFAULT_FILTERS,
        textLayers: [],
        stickers: [],
        drawingPaths: [],
        layerOrder: []
    };
    setFilters(DEFAULT_FILTERS);
    setHistory([emptySnapshot]);
    setHistoryIndex(0);
    setProcessedImage(null);
    setIsCropping(false);
    setCropParams({ zoom: 1, aspect: null });
    setHistogramData(null);
    setViewZoom(1);
    setTextLayers([]);
    setActiveTextId(null);
    setStickers([]);
    setActiveStickerId(null);
    setLayerOrder([]);
    setActiveFrame('none');
    setDrawingPaths([]);
    setDetectedObjects([]);
    setBrushSettings(prev => ({ ...prev, isEnabled: false }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyPreset = (presetFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const newState = { ...prev, ...presetFilters, rotate: prev.rotate, flipH: prev.flipH };
      // Determine new state immediately for history
      pushToHistory({ filters: newState });
      return newState;
    });
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setImageSrc(e.target.result);
          const initialSnapshot: HistorySnapshot = {
            filters: DEFAULT_FILTERS,
            textLayers: [],
            stickers: [],
            drawingPaths: [],
            layerOrder: []
          };
          setFilters(DEFAULT_FILTERS); 
          setHistory([initialSnapshot]); 
          setHistoryIndex(0);
          setProcessedImage(null);
          setIsCropping(false);
          setCropParams({ zoom: 1, aspect: null });
          setHistogramData(null);
          setViewZoom(1);
          setTextLayers([]);
          setStickers([]);
          setLayerOrder([]);
          setActiveFrame('none');
          setDrawingPaths([]);
          setDetectedObjects([]);
          setExportConfig(prev => ({ ...prev, name: file.name.split('.')[0] + '-edit' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { 
    e.preventDefault(); 
    if (e.currentTarget.contains(e.relatedTarget as Node)) return; 
    setIsDragging(false); 
  };
  const onDrop = (e: React.DragEvent) => { 
    e.preventDefault(); setIsDragging(false); 
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); 
  };
  const triggerUpload = () => fileInputRef.current?.click();

  const handleOpenExport = () => {
      if (processedImage) setShowExportModal(true);
  };

  const handleSaveImage = () => {
    if (processedImage) {
        const img = new Image();
        img.src = processedImage;
        img.onload = () => {
            const cvs = document.createElement('canvas');
            cvs.width = img.width;
            cvs.height = img.height;
            const ctx = cvs.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const ext = exportConfig.format === 'image/jpeg' ? 'jpg' : (exportConfig.format === 'image/webp' ? 'webp' : 'png');
                const finalData = cvs.toDataURL(exportConfig.format, exportConfig.quality);
                const link = document.createElement('a');
                link.download = `${exportConfig.name}.${ext}`;
                link.href = finalData;
                link.click();
                setShowExportModal(false);
            }
        };
    }
  };

  const handleImageProcessed = useCallback((base64: string, isCropResult = false) => {
    if (isCropResult) {
      setImageSrc(base64);
      setIsCropping(false);
      setCropParams({ zoom: 1, aspect: null });
      
      // Reset layers on crop apply as coordinates shift
      const resetSnapshot: HistorySnapshot = {
        filters: filters, // Keep filters
        textLayers: [],
        stickers: [],
        drawingPaths: [],
        layerOrder: []
      };
      setHistory([resetSnapshot]); 
      setHistoryIndex(0);
      setTextLayers([]);
      setStickers([]); 
      setLayerOrder([]);
      setDrawingPaths([]);
      setDetectedObjects([]);
    } else {
      setProcessedImage(base64);
    }
  }, [filters]);

  const handleApplyCrop = () => setCropTrigger(prev => prev + 1);

  // --- Text & Creative Handlers ---
  const handleAddText = (type: 'heading' | 'body') => {
    setBrushSettings(prev => ({ ...prev, isEnabled: false }));
    const newLayer: TextLayer = {
      id: Date.now().toString(),
      text: type === 'heading' ? (language === 'vi' ? 'Tiêu đề' : 'Heading') : (language === 'vi' ? 'Văn bản' : 'Body Text'),
      x: 50 + textLayers.length * 10, y: 50 + textLayers.length * 10,
      fontSize: type === 'heading' ? 60 : 30, color: '#ffffff',
      fontFamily: 'Arial', fontWeight: type === 'heading' ? 'bold' : 'normal', fontStyle: 'normal'
    };
    const newTextLayers = [...textLayers, newLayer];
    const newOrder = [...layerOrder, { id: newLayer.id, type: 'text' as const }];
    
    setTextLayers(newTextLayers);
    setLayerOrder(newOrder);
    setActiveTextId(newLayer.id);
    
    pushToHistory({ textLayers: newTextLayers, layerOrder: newOrder });
  };

  const handleUpdateTextLayer = (id: string, updates: Partial<TextLayer>) => {
      const newLayers = textLayers.map(l => l.id === id ? { ...l, ...updates } : l);
      setTextLayers(newLayers);
      // Optimization: Don't push to history on every keystroke/slide, usually done onBlur or MouseUp.
      // But for simplicity here we might let the user manual actions trigger specific history saves or rely on the parent calling onAddToHistory
  };
  
  const handleDeleteText = (id: string) => { 
      const newLayers = textLayers.filter(l => l.id !== id);
      const newOrder = layerOrder.filter(l => l.id !== id);
      setTextLayers(newLayers); 
      setLayerOrder(newOrder);
      if (activeTextId === id) setActiveTextId(null); 
      pushToHistory({ textLayers: newLayers, layerOrder: newOrder });
  };

  const handleAddSticker = (content: string) => {
     setBrushSettings(prev => ({ ...prev, isEnabled: false }));
     const isImage = content.startsWith('data:image');
     const newSticker: StickerLayer = {
         id: Date.now().toString(),
         type: isImage ? 'image' : 'emoji',
         content: content,
         x: 100 + stickers.length * 10,
         y: 100 + stickers.length * 10,
         size: 80
     };
     const newStickers = [...stickers, newSticker];
     const newOrder = [...layerOrder, { id: newSticker.id, type: 'sticker' as const }];
     
     setStickers(newStickers);
     setLayerOrder(newOrder);
     setActiveStickerId(newSticker.id);
     
     pushToHistory({ stickers: newStickers, layerOrder: newOrder });
  };

  const handleUpdateStickerPosition = (id: string, x: number, y: number) => {
      setStickers(prev => prev.map(s => s.id === id ? { ...s, x, y } : s));
  };
  
  const handleDeleteSticker = (id: string) => {
      const newStickers = stickers.filter(s => s.id !== id);
      const newOrder = layerOrder.filter(s => s.id !== id);
      setStickers(newStickers);
      setLayerOrder(newOrder);
      if (activeStickerId === id) setActiveStickerId(null);
      pushToHistory({ stickers: newStickers, layerOrder: newOrder });
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
      const index = layerOrder.findIndex(l => l.id === id);
      if (index === -1) return;
      
      const newOrder = [...layerOrder];
      if (direction === 'up' && index < newOrder.length - 1) {
          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      } 
      else if (direction === 'down' && index > 0) {
          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      }
      setLayerOrder(newOrder);
      pushToHistory({ layerOrder: newOrder });
  };

  // --- Drawing Handler with History ---
  const handleAddDrawingPath = (path: DrawingPath) => {
    const newPaths = [...drawingPaths, path];
    setDrawingPaths(newPaths);
    // Immediately save this stroke to history so Undo works for it
    pushToHistory({ drawingPaths: newPaths });
  };
  
  const handleClearDrawings = () => {
      setDrawingPaths([]);
      pushToHistory({ drawingPaths: [] });
  };
  
  const handleToggleBrush = (enabled: boolean) => {
    setBrushSettings(prev => ({ ...prev, isEnabled: enabled }));
    if (enabled) { setActiveTextId(null); setActiveStickerId(null); }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'vi' : 'en');
  const handleZoomIn = () => setViewZoom(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setViewZoom(prev => Math.max(prev - 0.2, 0.2));
  const handleFitScreen = () => setViewZoom(1);

  return (
    <div 
      className={`
        h-screen w-screen overflow-hidden relative transition-colors duration-700
        ${isDarkMode ? 'dark bg-[#050505]' : 'bg-rose-50/50'}
      `}
      onDragOver={onDragOver} 
      onDragLeave={onDragLeave} 
      onDrop={onDrop}
    >
      {/* === AURORA BACKGROUND & NOISE === */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-noise opacity-50 z-10"></div>

        {/* Grid / Dots */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-10 bg-grid-pattern' : 'opacity-30 bg-dot-pattern'}`}></div>
        
        {/* Moving Blobs */}
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[100px] mix-blend-screen animate-blob filter opacity-40 ${isDarkMode ? 'bg-cyan-900' : 'bg-pink-200'}`}></div>
        <div className={`absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-2000 filter opacity-40 ${isDarkMode ? 'bg-purple-900' : 'bg-violet-200'}`}></div>
        <div className={`absolute -bottom-32 left-1/3 w-[600px] h-[600px] rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000 filter opacity-40 ${isDarkMode ? 'bg-blue-900' : 'bg-orange-100'}`}></div>
      </div>

      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-xl flex items-center justify-center animate-fade-in">
          <div className="w-[90%] h-[90%] border-4 border-dashed border-pink-400 dark:border-cyan-400 rounded-[3rem] flex flex-col items-center justify-center gap-8 animate-pulse">
            <div className="p-10 rounded-full bg-pink-100 dark:bg-cyan-900/30 text-pink-500 dark:text-cyan-400 shadow-2xl"><ImagePlus size={100} strokeWidth={1.5} /></div>
            <h2 className="text-5xl font-black text-gray-800 dark:text-white font-tech uppercase tracking-wider">{t.dropImageHere}</h2>
            <p className="text-gray-500 dark:text-cyan-300 text-xl font-medium">{t.releaseToUpload}</p>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {showExportModal && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className={`
                  w-full max-w-md p-8 rounded-[2rem] shadow-2xl transition-colors duration-300 border relative overflow-hidden
                  ${isDarkMode ? 'bg-[#121212]/90 border-white/10 shadow-cyan-500/10' : 'bg-white/90 border-white/40 shadow-xl'}
              `}>
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold dark:font-tech dark:uppercase dark:text-white tracking-wide">{t.exportTitle}</h3>
                      <button onClick={() => setShowExportModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"><X size={20} /></button>
                  </div>
                  
                  <div className="space-y-5">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 dark:font-tech ml-1 tracking-wider">{t.fileName}</label>
                          <input 
                            type="text" 
                            value={exportConfig.name}
                            onChange={(e) => setExportConfig(prev => ({...prev, name: e.target.value}))}
                            className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl dark:rounded-lg focus:outline-none focus:border-pink-400 dark:focus:border-cyan-400 dark:text-white dark:font-tech transition-all"
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 dark:font-tech ml-1 tracking-wider">{t.format}</label>
                          <div className="grid grid-cols-3 gap-3">
                              {['image/png', 'image/jpeg', 'image/webp'].map(fmt => (
                                  <button 
                                    key={fmt}
                                    onClick={() => setExportConfig(prev => ({...prev, format: fmt}))}
                                    className={`py-3 rounded-xl dark:rounded-lg text-xs font-bold transition-all dark:font-tech uppercase tracking-wide ${exportConfig.format === fmt ? 'bg-gradient-to-r from-pink-500 to-rose-500 dark:from-cyan-600 dark:to-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                                  >
                                      {fmt.split('/')[1].toUpperCase()}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-2">
                           <div className="flex justify-between px-1">
                              <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 dark:font-tech tracking-wider">{t.quality}</label>
                              <span className="text-xs font-bold text-gray-700 dark:text-white">{Math.round(exportConfig.quality * 100)}%</span>
                           </div>
                           <div className="h-8 flex items-center">
                            <input 
                                type="range" min={0.1} max={1} step={0.05}
                                value={exportConfig.quality}
                                onChange={(e) => setExportConfig(prev => ({...prev, quality: parseFloat(e.target.value)}))}
                                className="w-full accent-pink-500 dark:accent-cyan-500"
                            />
                           </div>
                      </div>
                      
                      <button 
                          onClick={handleSaveImage}
                          className="w-full py-4 mt-4 bg-gray-900 dark:bg-cyan-500 hover:bg-black dark:hover:bg-cyan-400 text-white dark:text-black rounded-2xl dark:rounded-lg font-bold dark:font-tech uppercase tracking-widest shadow-xl dark:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 hover:-translate-y-1"
                      >
                          <Save size={18} /> {t.save}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="h-full w-full flex flex-col text-gray-900 dark:text-gray-100 font-sans z-20 relative">
        
        {/* === FLOATING NAVBAR === */}
        <div className="pt-4 px-6 pb-2 z-50 shrink-0">
          <nav className={`
            flex items-center justify-between h-[72px] px-6 
            bg-white/60 dark:bg-[#050505]/60 backdrop-blur-2xl 
            border border-white/40 dark:border-white/5 
            rounded-[24px] shadow-lg shadow-black/5 dark:shadow-black/20
            transition-all duration-500 ease-out
          `}>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-400 dark:bg-cyan-500 blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-500 rounded-full"></div>
                  <div className={`relative w-10 h-10 flex items-center justify-center transition-all duration-300 ${isDarkMode ? 'rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-400' : 'rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20'}`}>
                    <Zap size={isDarkMode ? 20 : 22} className={isDarkMode ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : ""} fill="currentColor" />
                  </div>
                </div>
                <div>
                    <h1 className={`text-2xl tracking-tight font-black bg-clip-text text-transparent ${isDarkMode ? 'font-tech bg-gradient-to-r from-white to-gray-400 tracking-widest uppercase' : 'bg-gradient-to-r from-gray-800 to-gray-600'}`}>MakeBetter</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center p-1 gap-1 ${isDarkMode ? 'bg-black/40 border border-white/10 rounded-lg' : 'bg-white/50 rounded-2xl border border-white/50'}`}>
                <button onClick={toggleLanguage} className={`w-9 h-9 flex items-center justify-center text-[10px] font-bold transition-all ${isDarkMode ? 'rounded-md text-gray-400 hover:text-white hover:bg-white/10 font-tech' : 'rounded-xl text-gray-500 hover:text-pink-600 hover:bg-white hover:shadow-sm'}`}>{language === 'en' ? 'VI' : 'EN'}</button>
                <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center transition-all ${isDarkMode ? 'rounded-md text-cyan-400 hover:bg-cyan-950/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'rounded-xl text-amber-500 hover:bg-white hover:shadow-sm'}`}>{isDarkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
              </div>
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              {!imageSrc && (
                <button onClick={triggerUpload} className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all ${isDarkMode ? 'font-tech uppercase tracking-widest rounded-lg border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'rounded-2xl bg-white border border-pink-100 text-gray-700 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 hover:shadow-lg shadow-sm'}`}><Upload size={16} /><span className="hidden sm:inline">{t.upload}</span></button>
              )}
              
              <button onClick={handleOpenExport} disabled={!imageSrc} className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all transform active:scale-95 ${imageSrc ? isDarkMode ? 'font-tech uppercase tracking-widest rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]' : 'rounded-2xl bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-900/20' : 'rounded-2xl dark:rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}><span className="hidden sm:inline">{t.download}</span><Download size={16} /></button>
            </div>
          </nav>
        </div>

        <div className="flex-1 flex overflow-hidden relative mt-2 mx-6 mb-6 gap-6">
          {/* === FLOATING SIDEBAR === */}
          <div className={`
             w-[360px] flex-shrink-0 flex flex-col z-40 transition-all duration-500 
             ${isDarkMode ? 'bg-[#0A0A0A]/70 border border-white/5' : 'bg-white/60 border border-white/40 shadow-2xl shadow-pink-500/5'} 
             backdrop-blur-xl rounded-[24px] overflow-hidden
          `}>
             <FilterControls 
                filters={filters} setFilters={setFilters} onReset={handleResetAll} t={t} language={language}
                isCropping={isCropping} setIsCropping={setIsCropping} cropParams={cropParams} setCropParams={setCropParams} onApplyCrop={handleApplyCrop}
                onAddToHistory={handleAddToHistory} currentImageBase64={imageSrc}
                onUndo={handleUndo} onRedo={handleRedo} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
                histogramData={histogramData} onRemoveImage={handleRemoveImage}
                activeTab={activeTab} setActiveTab={setActiveTab}
                onAddText={handleAddText} activeTextId={activeTextId} setActiveTextId={setActiveTextId} textLayers={textLayers} onUpdateTextLayer={handleUpdateTextLayer} onDeleteText={handleDeleteText}
                onApplyPreset={handleApplyPreset} onAddSticker={handleAddSticker} activeFrame={activeFrame} onSetFrame={setActiveFrame}
                brushSettings={brushSettings} setBrushSettings={setBrushSettings} onToggleBrush={handleToggleBrush} onClearDrawings={handleClearDrawings}
                activeStickerId={activeStickerId} setActiveStickerId={setActiveStickerId} stickers={stickers}
                onMoveLayer={handleMoveLayer} onDeleteSticker={handleDeleteSticker}
                layerOrder={layerOrder}
             />
          </div>

          {/* === CANVAS AREA === */}
          <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden gap-4">
             {/* Floating Zoom Controls */}
             {imageSrc && (
               <div className={`absolute bottom-8 right-8 z-30 flex gap-3 animate-fade-in`}>
                  <div className={`flex items-center gap-1 p-1.5 ${isDarkMode ? 'bg-black/80 border border-white/10 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]' : 'bg-white/80 rounded-2xl shadow-2xl shadow-pink-900/10 border border-white/60 backdrop-blur-xl'}`}>
                    <button 
                        onMouseDown={() => setIsComparing(true)} 
                        onMouseUp={() => setIsComparing(false)} 
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-pink-500 dark:text-cyan-400 transition-colors relative group"
                    >
                        <Eye size={20} />
                        <span className="absolute bottom-full mb-3 right-0 whitespace-nowrap bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{t.compare}</span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1"></div>
                    <button onClick={handleZoomOut} className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-300 transition-colors" title={t.zoomOut}><ZoomOut size={20} /></button>
                    <button onClick={handleFitScreen} className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-300 transition-colors" title={t.fitScreen}><Maximize size={20} /></button>
                    <button onClick={handleZoomIn} className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-600 dark:text-gray-300 transition-colors" title={t.zoomIn}><ZoomIn size={20} /></button>
                  </div>
               </div>
             )}

             <div className={`
                flex-1 relative rounded-[24px] overflow-hidden transition-all duration-500
                ${!imageSrc ? 'bg-transparent' : (isDarkMode ? 'bg-[#080808]/50 border border-white/5 shadow-2xl' : 'bg-white/30 border border-white/40 shadow-xl backdrop-blur-sm')}
             `}>
                {imageSrc ? (
                  <CanvasEditor 
                    imageSrc={imageSrc} filters={filters} onImageProcessed={handleImageProcessed} t={t}
                    isCropping={isCropping} cropParams={cropParams} cropTrigger={cropTrigger}
                    onHistogramData={setHistogramData} viewZoom={viewZoom}
                    textLayers={textLayers} activeTextId={activeTextId} onSelectText={setActiveTextId} onUpdateTextPosition={(id, x, y) => setTextLayers(prev => prev.map(l => l.id === id ? { ...l, x, y } : l))} onDeleteText={handleDeleteText}
                    stickers={stickers} activeStickerId={activeStickerId} onSelectSticker={setActiveStickerId} activeFrame={activeFrame} onUpdateStickerPosition={handleUpdateStickerPosition} onDeleteSticker={handleDeleteSticker}
                    drawingPaths={drawingPaths} brushSettings={brushSettings} onAddDrawingPath={handleAddDrawingPath}
                    isComparing={isComparing}
                    detectedObjects={detectedObjects}
                    layerOrder={layerOrder}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div onClick={triggerUpload} className={`w-full max-w-2xl h-full max-h-[500px] flex flex-col items-center justify-center gap-6 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all duration-300 group ${isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_40px_rgba(6,182,212,0.1)]' : 'border-pink-200 bg-white/30 hover:bg-white/60 hover:border-pink-300 hover:shadow-xl shadow-pink-500/5'}`}>
                      <div className={`
                         p-8 rounded-[1.5rem] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3
                         ${isDarkMode ? 'bg-cyan-950/30 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'bg-gradient-to-br from-white to-pink-50 text-pink-400 shadow-lg shadow-pink-500/10 border border-white/60'}
                      `}>
                        <Upload size={64} strokeWidth={1.5} className={isDarkMode ? "drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" : ""} />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white font-tech uppercase tracking-widest' : 'text-gray-700'}`}>{t.noImageTitle}</h3>
                        <p className={`text-base max-w-sm ${isDarkMode ? 'text-gray-500 font-tech' : 'text-gray-400'}`}>{t.noImageDesc}</p>
                      </div>
                      <button className={`px-8 py-3 rounded-xl font-bold text-xs transition-all ${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-500 text-black font-tech uppercase tracking-widest shadow-[0_0_20px_rgba(8,145,178,0.3)]' : 'bg-gray-800 hover:bg-black text-white shadow-lg hover:-translate-y-1'}`}>{t.selectFromComputer}</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
