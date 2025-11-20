
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Zap, Moon, Sun, ZoomIn, ZoomOut, Maximize, ImagePlus } from 'lucide-react';
import { FilterControls } from './components/FilterControls';
import { CanvasEditor } from './components/CanvasEditor';
import { FilterState, DEFAULT_FILTERS, HistogramData, TextLayer, StickerLayer, FrameType, DrawingPath, BrushSettings } from './types';
import { translations, Language } from './translations';

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
  
  // History State
  const [history, setHistory] = useState<FilterState[]>([DEFAULT_FILTERS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Crop State
  const [isCropping, setIsCropping] = useState(false);
  const [cropParams, setCropParams] = useState<{ zoom: number; aspect: number | null }>({ zoom: 1, aspect: null });
  const [cropTrigger, setCropTrigger] = useState(0);

  // Text Layers State
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);

  // Creative State
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [activeFrame, setActiveFrame] = useState<FrameType>('none');
  
  // Brush State (New)
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    color: '#ffffff',
    size: 10,
    opacity: 1,
    isEnabled: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  // --- History Management ---
  const handleAddToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(filters);
    if (newHistory.length > 50) newHistory.shift();
    else setHistoryIndex(newHistory.length - 1);
    setHistory(newHistory);
  }, [filters, history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFilters(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFilters(history[newIndex]);
    }
  };

  const handleResetAll = () => {
    setFilters(DEFAULT_FILTERS);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(DEFAULT_FILTERS);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setStickers([]);
    setActiveFrame('none');
    setDrawingPaths([]);
  };

  const handleRemoveImage = () => {
    setImageSrc(null);
    setFilters(DEFAULT_FILTERS);
    setHistory([DEFAULT_FILTERS]);
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
    setActiveFrame('none');
    setDrawingPaths([]);
    setBrushSettings(prev => ({ ...prev, isEnabled: false }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyPreset = (presetFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const newState = { ...prev, ...presetFilters, rotate: prev.rotate, flipH: prev.flipH };
      setTimeout(handleAddToHistory, 0);
      return newState;
    });
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setImageSrc(e.target.result);
          setFilters(DEFAULT_FILTERS); 
          setHistory([DEFAULT_FILTERS]); 
          setHistoryIndex(0);
          setProcessedImage(null);
          setIsCropping(false);
          setCropParams({ zoom: 1, aspect: null });
          setHistogramData(null);
          setViewZoom(1);
          setTextLayers([]);
          setStickers([]);
          setActiveFrame('none');
          setDrawingPaths([]);
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

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.download = `smartlens-edit-${Date.now()}.png`;
      link.href = processedImage;
      link.click();
    }
  };

  const handleImageProcessed = useCallback((base64: string, isCropResult = false) => {
    if (isCropResult) {
      setImageSrc(base64);
      setIsCropping(false);
      setCropParams({ zoom: 1, aspect: null });
      setHistory([filters]); 
      setHistoryIndex(0);
      setTextLayers([]);
      setStickers([]); 
      setDrawingPaths([]); // Drawings flatten on crop usually
    } else {
      setProcessedImage(base64);
    }
  }, [filters]);

  const handleApplyCrop = () => setCropTrigger(prev => prev + 1);

  // --- Text & Creative Handlers ---
  const handleAddText = (type: 'heading' | 'body') => {
    // Turn off brush when adding text
    setBrushSettings(prev => ({ ...prev, isEnabled: false }));
    const newLayer: TextLayer = {
      id: Date.now().toString(),
      text: type === 'heading' ? (language === 'vi' ? 'Tiêu đề' : 'Heading') : (language === 'vi' ? 'Văn bản' : 'Body Text'),
      x: 50 + textLayers.length * 10, y: 50 + textLayers.length * 10,
      fontSize: type === 'heading' ? 60 : 30, color: '#ffffff',
      fontFamily: 'Arial', fontWeight: type === 'heading' ? 'bold' : 'normal', fontStyle: 'normal'
    };
    setTextLayers([...textLayers, newLayer]);
    setActiveTextId(newLayer.id);
  };

  const handleUpdateTextLayer = (id: string, updates: Partial<TextLayer>) => setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  const handleDeleteText = (id: string) => { setTextLayers(prev => prev.filter(l => l.id !== id)); if (activeTextId === id) setActiveTextId(null); };

  const handleAddSticker = (emoji: string) => {
     // Turn off brush
     setBrushSettings(prev => ({ ...prev, isEnabled: false }));
     const newSticker: StickerLayer = {
         id: Date.now().toString(),
         content: emoji,
         x: 100 + stickers.length * 10,
         y: 100 + stickers.length * 10,
         size: 80
     };
     setStickers([...stickers, newSticker]);
     setActiveStickerId(newSticker.id);
  };

  const handleUpdateStickerPosition = (id: string, x: number, y: number) => {
      setStickers(prev => prev.map(s => s.id === id ? { ...s, x, y } : s));
  };
  
  const handleDeleteSticker = (id: string) => {
      setStickers(prev => prev.filter(s => s.id !== id));
      if (activeStickerId === id) setActiveStickerId(null);
  };

  const handleMoveLayer = (id: string, type: 'text' | 'sticker', direction: 'up' | 'down') => {
    if (type === 'text') {
      const index = textLayers.findIndex(l => l.id === id);
      if (index === -1) return;
      
      const newLayers = [...textLayers];
      if (direction === 'up' && index < textLayers.length - 1) {
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      } else if (direction === 'down' && index > 0) {
        [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      }
      setTextLayers(newLayers);
    } else {
      const index = stickers.findIndex(s => s.id === id);
      if (index === -1) return;
      
      const newStickers = [...stickers];
      if (direction === 'up' && index < stickers.length - 1) {
        [newStickers[index], newStickers[index + 1]] = [newStickers[index + 1], newStickers[index]];
      } else if (direction === 'down' && index > 0) {
        [newStickers[index], newStickers[index - 1]] = [newStickers[index - 1], newStickers[index]];
      }
      setStickers(newStickers);
    }
  };

  // --- Brush Handlers ---
  const handleAddDrawingPath = (path: DrawingPath) => {
    setDrawingPaths(prev => [...prev, path]);
  };
  const handleClearDrawings = () => setDrawingPaths([]);
  const handleToggleBrush = (enabled: boolean) => {
    setBrushSettings(prev => ({ ...prev, isEnabled: enabled }));
    // If enabling brush, deselect active items
    if (enabled) {
        setActiveTextId(null);
        setActiveStickerId(null);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'vi' : 'en');
  const handleZoomIn = () => setViewZoom(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setViewZoom(prev => Math.max(prev - 0.2, 0.2));
  const handleFitScreen = () => setViewZoom(1);

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-screen overflow-hidden relative`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in">
          <div className="w-[90%] h-[90%] border-4 border-dashed border-pink-400 dark:border-cyan-400 rounded-3xl flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="p-8 rounded-full bg-pink-100 dark:bg-cyan-900/50 text-pink-500 dark:text-cyan-400 shadow-xl"><ImagePlus size={80} /></div>
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white font-tech uppercase tracking-wider">{t.dropImageHere}</h2>
            <p className="text-gray-500 dark:text-cyan-300 text-lg font-medium">{t.releaseToUpload}</p>
          </div>
        </div>
      )}

      <div className="h-full w-full flex flex-col bg-rose-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 transition-colors duration-500 font-sans">
        <div className="pt-4 px-6 pb-2 dark:pt-0 dark:px-0 dark:pb-0 z-50 shrink-0">
          <nav className={`flex items-center justify-between transition-all duration-500 h-16 px-6 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/50 dark:border-b dark:border-x-0 dark:border-t-0 dark:border-white/10 rounded-full dark:rounded-none shadow-lg shadow-pink-500/5 dark:shadow-none`}>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-400 dark:bg-cyan-500 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                  <div className={`relative w-9 h-9 flex items-center justify-center transition-all duration-300 ${isDarkMode ? 'rounded-sm bg-cyan-950/30 border border-cyan-500/30 text-cyan-400' : 'rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-md'}`}>
                    <Zap size={isDarkMode ? 18 : 20} className={isDarkMode ? "drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" : ""} fill="currentColor" />
                  </div>
                </div>
                <h1 className={`text-2xl tracking-tight font-bold bg-clip-text text-transparent ${isDarkMode ? 'font-tech bg-gradient-to-r from-white to-gray-400 tracking-widest uppercase' : 'bg-gradient-to-r from-gray-800 to-gray-600'}`}>SmartLens</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center p-1 gap-1 ${isDarkMode ? 'bg-black border border-white/10 rounded-sm' : 'bg-gray-100 rounded-full border border-gray-200'}`}>
                <button onClick={toggleLanguage} className={`w-9 h-9 flex items-center justify-center text-xs font-bold transition-all ${isDarkMode ? 'rounded-sm text-gray-400 hover:text-white hover:bg-white/10 font-tech' : 'rounded-full text-gray-500 hover:text-pink-600 hover:bg-white hover:shadow-sm'}`}>{language === 'en' ? 'VI' : 'EN'}</button>
                <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center transition-all ${isDarkMode ? 'rounded-sm text-cyan-400 hover:bg-cyan-950/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'rounded-full text-amber-500 hover:bg-white hover:shadow-sm'}`}>{isDarkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              {!imageSrc && (
                <button onClick={triggerUpload} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all ${isDarkMode ? 'font-tech uppercase tracking-wide rounded-sm border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md'}`}><Upload size={18} /><span className="hidden sm:inline">{t.upload}</span></button>
              )}
              <button onClick={handleDownload} disabled={!imageSrc} className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all transform active:scale-95 ${imageSrc ? isDarkMode ? 'font-tech uppercase rounded-sm bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(8,145,178,0.6)]' : 'rounded-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white shadow-lg shadow-pink-500/30' : 'rounded-full dark:rounded-sm bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}><span className="hidden sm:inline">{t.download}</span><Download size={18} /></button>
            </div>
          </nav>
        </div>

        <div className="flex-1 flex overflow-hidden relative mt-2 md:mt-4 mx-0 md:mx-4 mb-4 gap-4">
          <div className={`w-80 flex-shrink-0 flex flex-col z-40 transition-all duration-500 ${isDarkMode ? 'bg-[#0A0A0A]/90 border-r border-white/10' : 'bg-white/80 border border-white/60 shadow-xl rounded-3xl mb-2 ml-2'} backdrop-blur-xl`}>
             <FilterControls 
                filters={filters} setFilters={setFilters} onReset={handleResetAll} t={t} language={language}
                isCropping={isCropping} setIsCropping={setIsCropping} cropParams={cropParams} setCropParams={setCropParams} onApplyCrop={handleApplyCrop}
                onAddToHistory={handleAddToHistory} currentImageBase64={imageSrc}
                onUndo={handleUndo} onRedo={handleRedo} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
                histogramData={histogramData} onRemoveImage={handleRemoveImage}
                activeTab={activeTab} setActiveTab={setActiveTab}
                onAddText={handleAddText} activeTextId={activeTextId} textLayers={textLayers} onUpdateTextLayer={handleUpdateTextLayer} onDeleteText={handleDeleteText}
                onApplyPreset={handleApplyPreset} onAddSticker={handleAddSticker} activeFrame={activeFrame} onSetFrame={setActiveFrame}
                brushSettings={brushSettings} setBrushSettings={setBrushSettings} onToggleBrush={handleToggleBrush} onClearDrawings={handleClearDrawings}
                activeStickerId={activeStickerId} setActiveStickerId={setActiveStickerId} stickers={stickers}
                onMoveLayer={handleMoveLayer} onDeleteSticker={handleDeleteSticker}
             />
          </div>

          <div className="flex-1 relative flex flex-col min-w-0 bg-transparent overflow-hidden mr-2 mb-2 gap-2">
             {/* Zoom Controls */}
             {imageSrc && (
               <div className={`absolute top-4 right-4 z-30 flex flex-col gap-2`}>
                  <div className={`flex flex-col gap-1 p-1 ${isDarkMode ? 'bg-black/80 border border-white/10 rounded-sm' : 'bg-white/80 rounded-xl shadow-lg border border-white/50 backdrop-blur-md'}`}>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg dark:rounded-sm text-gray-600 dark:text-gray-300 transition-colors" title={t.zoomIn}><ZoomIn size={18} /></button>
                    <button onClick={handleFitScreen} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg dark:rounded-sm text-gray-600 dark:text-gray-300 transition-colors" title={t.fitScreen}><Maximize size={18} /></button>
                    <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg dark:rounded-sm text-gray-600 dark:text-gray-300 transition-colors" title={t.zoomOut}><ZoomOut size={18} /></button>
                  </div>
               </div>
             )}

             <div className={`flex-1 relative rounded-3xl overflow-hidden ${!imageSrc ? 'bg-transparent' : (isDarkMode ? '' : 'bg-white/40')}`}>
                {imageSrc ? (
                  <CanvasEditor 
                    imageSrc={imageSrc} filters={filters} onImageProcessed={handleImageProcessed} t={t}
                    isCropping={isCropping} cropParams={cropParams} cropTrigger={cropTrigger}
                    onHistogramData={setHistogramData} viewZoom={viewZoom}
                    textLayers={textLayers} activeTextId={activeTextId} onSelectText={setActiveTextId} onUpdateTextPosition={(id, x, y) => setTextLayers(prev => prev.map(l => l.id === id ? { ...l, x, y } : l))}
                    stickers={stickers} activeStickerId={activeStickerId} onSelectSticker={setActiveStickerId} activeFrame={activeFrame} onUpdateStickerPosition={handleUpdateStickerPosition}
                    drawingPaths={drawingPaths} brushSettings={brushSettings} onAddDrawingPath={handleAddDrawingPath}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div onClick={triggerUpload} className={`w-full max-w-2xl h-full max-h-[500px] flex flex-col items-center justify-center gap-6 border-2 border-dashed rounded-3xl dark:rounded-sm cursor-pointer transition-all group ${isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-gray-300 bg-white/50 hover:bg-white/80 hover:border-pink-400 hover:shadow-xl'}`}>
                      <div className={`p-8 rounded-full dark:rounded-sm transition-transform duration-500 group-hover:scale-110 ${isDarkMode ? 'bg-cyan-950/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-gradient-to-br from-pink-100 to-violet-100 text-pink-500 shadow-inner'}`}><Upload size={64} className={isDarkMode ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : ""} /></div>
                      <div className="text-center space-y-2"><h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white font-tech uppercase tracking-widest' : 'text-gray-700'}`}>{t.noImageTitle}</h3><p className={`max-w-md ${isDarkMode ? 'text-gray-400 font-tech' : 'text-gray-500'}`}>{t.noImageDesc}</p></div>
                      <button className={`px-8 py-3 rounded-full dark:rounded-sm font-bold transition-all ${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-500 text-black font-tech uppercase tracking-wide' : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'}`}>{t.selectFromComputer}</button>
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
