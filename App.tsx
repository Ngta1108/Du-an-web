
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
  const [originalImageBackup, setOriginalImageBackup] = useState<string | null>(null); // Backup for AI operations
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
      pushToHistory();
  }, [filters, textLayers, stickers, drawingPaths, layerOrder, history, historyIndex]);

  const handleUndo = useCallback(() => {
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
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
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
  }, [historyIndex, history]);

  const handleResetAll = useCallback(() => {
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
  }, [history, historyIndex]);

  const handleRemoveImage = useCallback(() => {
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
  }, []);

  const handleApplyPreset = useCallback((presetFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const newState = { ...prev, ...presetFilters, rotate: prev.rotate, flipH: prev.flipH };
      // Determine new state immediately for history
      pushToHistory({ filters: newState });
      return newState;
    });
  }, [filters, textLayers, stickers, drawingPaths, layerOrder, history, historyIndex]);

  const handleReplaceImage = useCallback((newImageBase64: string) => {
    // Backup original if not already backed up
    if (!originalImageBackup && imageSrc) {
      setOriginalImageBackup(imageSrc);
    }
    setImageSrc(newImageBase64);
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
  }, [originalImageBackup, imageSrc]);

  const handleRestoreOriginal = useCallback(() => {
    if (originalImageBackup) {
      setImageSrc(originalImageBackup);
      setOriginalImageBackup(null);
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
    }
  }, [originalImageBackup]);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setImageSrc(e.target.result);
          setOriginalImageBackup(null); // Clear backup when new image loaded
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
      fontFamily: 'Be Vietnam Pro', fontWeight: type === 'heading' ? 'bold' : 'normal', fontStyle: 'normal',
      // New Defaults
      strokeWidth: 0,
      strokeColor: '#000000',
      shadowBlur: 0,
      shadowColor: '#000000',
      backgroundColor: 'transparent',
      opacity: 1,
      letterSpacing: 0
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
        ${isDarkMode ? 'dark bg-black' : 'bg-rose-50/50'}
      `}
      onDragOver={onDragOver} 
      onDragLeave={onDragLeave} 
      onDrop={onDrop}
    >
      {/* === AURORA BACKGROUND & NOISE === */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-noise opacity-50 z-10"></div>

        {/* Particles - Stars & Shooting Stars for Dark, Cherry Blossoms for Light */}
        <div className="absolute inset-0 z-5 overflow-hidden">
          {isDarkMode ? (
            <>
              {/* Twinkling Stars (Dark Mode) */}
              {[...Array(50)].map((_, i) => (
                <div
                  key={`star-${i}`}
                  className="star"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                    opacity: Math.random() * 0.5 + 0.3,
                  }}
                />
              ))}
              
              {/* Shooting Stars (Dark Mode) */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={`shooting-${i}`}
                  className="shooting-star"
                  style={{
                    top: `${Math.random() * 40}%`,
                    right: `${-20 - Math.random() * 20}%`,
                    animationDelay: `${i * 3 + Math.random() * 5}s`,
                    animationDuration: `${1.5 + Math.random() * 1}s`,
                    animationIterationCount: 'infinite',
                  }}
                />
              ))}
            </>
          ) : (
            // Cherry Blossom Petals (Light Mode) 🌸
            [...Array(30)].map((_, i) => (
              <div
                key={`cherry-${i}`}
                className="cherry-blossom"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${12 + Math.random() * 8}s`,
                  transform: `scale(${0.7 + Math.random() * 0.6})`,
                }}
              />
            ))
          )}
        </div>

        {/* Grid / Dots */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-10 bg-grid-pattern' : 'opacity-30 bg-dot-pattern'}`}></div>
        
        {/* Moving Blobs - Enhanced */}
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] mix-blend-screen animate-blob filter ${isDarkMode ? 'opacity-20 bg-gradient-radial from-gray-700 to-gray-900' : 'opacity-60 bg-gradient-radial from-pink-400 via-rose-300 to-pink-200'}`}></div>
        <div className={`absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000 filter ${isDarkMode ? 'opacity-20 bg-gradient-radial from-gray-600 to-gray-800' : 'opacity-60 bg-gradient-radial from-violet-400 via-purple-300 to-violet-200'}`}></div>
        <div className={`absolute -bottom-32 left-1/3 w-[600px] h-[600px] rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-4000 filter ${isDarkMode ? 'opacity-20 bg-gradient-radial from-gray-500 to-gray-900' : 'opacity-60 bg-gradient-radial from-amber-300 via-orange-200 to-yellow-200'}`}></div>
        
        {/* Floating Orbs */}
        <div className={`absolute top-1/4 left-1/2 w-32 h-32 rounded-full blur-2xl animate-float ${isDarkMode ? 'opacity-15 bg-gray-600' : 'opacity-40 bg-gradient-to-br from-pink-400 to-rose-500'}`} style={{animationDelay: '0s', animationDuration: '4s'}}></div>
        <div className={`absolute top-3/4 right-1/3 w-24 h-24 rounded-full blur-2xl animate-float ${isDarkMode ? 'opacity-10 bg-gray-700' : 'opacity-35 bg-gradient-to-br from-fuchsia-400 to-pink-500'}`} style={{animationDelay: '1s', animationDuration: '5s'}}></div>
        <div className={`absolute top-1/2 left-1/4 w-20 h-20 rounded-full blur-xl animate-float ${isDarkMode ? 'opacity-10 bg-gray-800' : 'opacity-30 bg-gradient-to-br from-violet-400 to-purple-500'}`} style={{animationDelay: '2s', animationDuration: '6s'}}></div>
        
        {/* Extra sparkles for light mode */}
        {!isDarkMode && (
          <>
            <div className="absolute top-1/3 right-1/2 w-16 h-16 rounded-full blur-xl bg-gradient-to-br from-amber-300 to-orange-400 opacity-40 animate-float" style={{animationDelay: '1.5s', animationDuration: '5s'}}></div>
            <div className="absolute bottom-1/3 left-1/2 w-20 h-20 rounded-full blur-lg bg-gradient-to-br from-rose-300 to-pink-400 opacity-35 animate-float" style={{animationDelay: '0.5s', animationDuration: '4.5s'}}></div>
          </>
        )}
      </div>

      {isDragging && (
        <div className="absolute inset-0 z-[100] glass bg-white/95 dark:bg-black/95 backdrop-blur-2xl flex items-center justify-center animate-fade-in">
          {/* Animated background rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] rounded-full border-2 border-pink-300/30 dark:border-cyan-400/30 animate-ping"></div>
            <div className="absolute w-[400px] h-[400px] rounded-full border-2 border-pink-400/40 dark:border-cyan-300/40 animate-ping" style={{animationDelay: '0.3s'}}></div>
          </div>
          
          <div className="relative w-[90%] h-[90%] border-4 border-dashed border-pink-400 dark:border-cyan-400 rounded-[3rem] flex flex-col items-center justify-center gap-8 animate-pulse shadow-2xl shadow-pink-500/20 dark:shadow-cyan-500/20">
            {/* Icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-pink-400 dark:bg-cyan-400 blur-3xl opacity-50 animate-pulse"></div>
              <div className="relative p-12 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 dark:from-cyan-900/50 dark:to-blue-900/50 text-pink-500 dark:text-cyan-400 shadow-2xl animate-float border-4 border-white/50 dark:border-white/10">
                <ImagePlus size={120} strokeWidth={1.5} className="drop-shadow-2xl" />
              </div>
            </div>
            
            {/* Text with gradient */}
            <div className="text-center space-y-3">
              <h2 className="text-6xl font-black bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 dark:from-cyan-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent font-tech uppercase tracking-wider animate-gradient">{t.dropImageHere}</h2>
              <p className="text-gray-600 dark:text-cyan-300 text-2xl font-bold animate-pulse">{t.releaseToUpload}</p>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {showExportModal && (
          <div className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
              <div className={`
                  w-full max-w-md p-8 rounded-[2.5rem] dark:rounded-[1.5rem] transition-all duration-500 border relative overflow-hidden glass-premium animate-fade-in-up border-glow card-depth
                  ${isDarkMode ? 'bg-[#0f0f0f]/95 border-white/20 shadow-premium-dark ambient-glow-dark' : 'bg-white/95 border-pink-200/60 shadow-premium-light ambient-glow-light'}
              `}>
                  <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-black dark:font-tech dark:uppercase dark:text-white tracking-wide bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{t.exportTitle}</h3>
                      <button onClick={() => setShowExportModal(false)} className="p-2.5 rounded-full hover:bg-pink-100 dark:hover:bg-white/10 transition-all hover:rotate-90 hover-scale text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-white border border-transparent hover:border-pink-200 dark:hover:border-white/20"><X size={20} className="icon-3d" strokeWidth={2.5} /></button>
                  </div>
                  
                  <div className="space-y-5">
                      <div className="space-y-2">
                          <label className="text-[10px] font-extrabold uppercase text-gray-700 dark:text-gray-200 dark:font-tech ml-1 tracking-wider">{t.fileName}</label>
                          <input 
                            type="text" 
                            value={exportConfig.name}
                            onChange={(e) => setExportConfig(prev => ({...prev, name: e.target.value}))}
                            className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl dark:rounded-lg focus:outline-none focus:border-pink-400 dark:focus:border-cyan-400 dark:text-white dark:font-tech transition-all"
                          />
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] font-extrabold uppercase text-gray-700 dark:text-gray-200 dark:font-tech ml-1 tracking-wider">{t.format}</label>
                          <div className="grid grid-cols-3 gap-3">
                              {['image/png', 'image/jpeg', 'image/webp'].map(fmt => (
                                  <button 
                                    key={fmt}
                                    onClick={() => setExportConfig(prev => ({...prev, format: fmt}))}
                                    className={`py-3.5 rounded-xl dark:rounded-lg text-xs font-bold transition-all duration-300 dark:font-tech uppercase tracking-wide hover-lift ${exportConfig.format === fmt ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 dark:from-cyan-500 dark:via-blue-500 dark:to-cyan-600 text-white shadow-xl shadow-pink-500/30 dark:shadow-cyan-500/30 scale-105 border-2 border-white/30' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10 hover:scale-105'}`}
                                  >
                                      {fmt.split('/')[1].toUpperCase()}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-2">
                           <div className="flex justify-between px-1">
                              <label className="text-[10px] font-extrabold uppercase text-gray-700 dark:text-gray-200 dark:font-tech tracking-wider">{t.quality}</label>
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
                          className="btn-magnetic btn-ripple w-full py-4 mt-6 btn-gradient-pink dark:bg-gradient-to-r dark:from-gray-700 dark:to-gray-800 text-white rounded-2xl dark:rounded-xl font-black dark:font-tech uppercase tracking-widest glow-pink hover-float active:scale-95 border-2 border-pink-300/50 dark:border-gray-600 hover:border-pink-200 dark:hover:border-gray-500 group relative overflow-hidden border-glow shadow-premium-light dark:shadow-lg hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-3"
                      >
                          {/* Enhanced Save Icon */}
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full blur-lg bg-white opacity-0 group-hover:opacity-60 transition-opacity"></div>
                            <Save size={22} className="icon-3d relative group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" strokeWidth={2.5} />
                          </div>
                          
                          <span className="relative z-10">{t.save}</span>
                          
                          {/* Shine sweep */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="h-full w-full flex flex-col text-gray-900 dark:text-gray-100 font-sans z-20 relative">
        
        {/* === FLOATING NAVBAR === */}
        <div className="pt-4 px-6 pb-2 z-50 shrink-0 animate-fade-in text-reveal">
          <nav className={`
            relative flex items-center justify-between h-[72px] px-6 
            glass bg-white/80 dark:bg-[#050505]/80 
            border-2 border-white/70 dark:border-white/15 
            rounded-[24px] shadow-2xl shadow-pink-500/10 dark:shadow-cyan-500/15
            transition-all duration-500 ease-out hover:shadow-3xl hover:border-pink-200 dark:hover:border-cyan-500/30
            card-premium overflow-hidden
          `}>
            {/* Top shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
            {/* Bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/50 dark:via-cyan-400/50 to-transparent"></div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative">
                  {/* Pulsing glow */}
                  <div className="absolute inset-0 bg-pink-400 dark:bg-gray-500 blur-2xl opacity-20 group-hover:opacity-40 animate-pulse-glow rounded-full"></div>
                  
                  {/* Icon container with shimmer */}
                  <div className={`relative w-11 h-11 flex items-center justify-center transition-all duration-500 overflow-hidden ${isDarkMode ? 'rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-300 group-hover:border-gray-600 group-hover:shadow-lg' : 'rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white shadow-xl shadow-pink-500/30 group-hover:shadow-glow-pink'} group-hover:scale-110 group-hover:rotate-3`}>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-shimmer opacity-0 group-hover:opacity-100 animate-shimmer"></div>
                    
                    {/* Glow circle behind icon */}
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity ${isDarkMode ? 'bg-gray-300' : 'bg-white'}`}></div>
                    
                    <Zap size={isDarkMode ? 22 : 24} className={`relative z-10 icon-3d ${isDarkMode ? "text-gray-200" : "text-white"} group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`} fill="currentColor" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="relative">
                    <h1 className={`text-2xl tracking-tight font-black bg-clip-text text-transparent animate-gradient text-shadow-premium ${isDarkMode ? 'font-tech bg-gradient-to-r from-gray-200 via-white to-gray-200 tracking-widest uppercase' : 'bg-gradient-to-r from-gray-900 via-pink-600 to-gray-900'} group-hover:scale-105 transition-transform`}>MakeBetter</h1>
                    {/* Subtitle */}
                    <p className={`text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5 ${isDarkMode ? 'text-gray-400 font-tech' : 'text-pink-500/70'}`}>AI Photo Editor</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center p-1.5 gap-2 glass-premium card-depth ${isDarkMode ? 'bg-black/50 border border-white/10 rounded-xl shadow-premium-dark hover:border-white/20' : 'bg-white/70 rounded-2xl border border-pink-200/60 shadow-premium-light hover:border-pink-300'} transition-all duration-300 border-glow`}>
                <button onClick={toggleLanguage} className={`w-10 h-10 flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 relative overflow-hidden group icon-gradient hover-scale btn-ripple ${isDarkMode ? 'rounded-lg text-gray-300 hover:text-white hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 font-tech' : 'rounded-xl text-gray-700 hover:text-pink-600 hover:bg-white hover:shadow-lg'}`}>
                  <span className={`relative z-10 group-hover:scale-110 transition-transform ${isDarkMode ? 'group-hover:text-cyan-300' : 'group-hover:text-pink-500'}`} style={{textShadow: '0 2px 8px currentColor'}}>{language === 'en' ? 'VI' : 'EN'}</span>
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-cyan-500/0 to-cyan-500/20' : 'bg-gradient-to-r from-pink-500/0 to-pink-500/10'} translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300`}></div>
                  {/* Glow on hover */}
                  <div className={`absolute inset-0 rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-opacity ${isDarkMode ? 'bg-cyan-400' : 'bg-pink-500'}`}></div>
                </button>
                <div className={`w-px h-6 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                <button onClick={toggleTheme} className={`w-10 h-10 flex items-center justify-center transition-all duration-500 relative overflow-hidden group icon-gradient hover-scale btn-ripple ${isDarkMode ? 'rounded-lg text-cyan-400 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20 glow-cyan hover:rotate-180' : 'rounded-xl text-amber-500 hover:bg-gradient-to-br hover:from-amber-100 hover:to-orange-100 glow-pink hover:shadow-xl hover:rotate-180'}`}>
                  {/* Orbital glow */}
                  <div className={`absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity ${isDarkMode ? 'bg-cyan-400' : 'bg-amber-400'}`}></div>
                  
                  <span className="relative z-10">
                    {isDarkMode ? (
                      <Sun size={20} className="icon-3d group-hover:scale-125 transition-all duration-500 text-cyan-300" strokeWidth={2.5} />
                    ) : (
                      <Moon size={20} className="icon-3d group-hover:scale-125 transition-all duration-500 text-amber-400" strokeWidth={2.5} />
                    )}
                  </span>
                  
                  {/* Rays effect for sun */}
                  {!isDarkMode && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-0.5 h-2 bg-amber-400 blur-[1px]"
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: `rotate(${i * 45}deg) translateY(-15px)`,
                            transformOrigin: '0 0'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              </div>
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              {!imageSrc && (
                <button onClick={triggerUpload} className={`btn-magnetic hover-lift btn-ripple flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all duration-300 group relative overflow-hidden ${isDarkMode ? 'font-tech uppercase tracking-widest rounded-lg border-2 border-cyan-500/60 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:border-cyan-300 hover:scale-105' : 'rounded-2xl bg-gradient-to-r from-white to-pink-50 border-2 border-pink-200 text-gray-700 hover:from-pink-50 hover:to-rose-50 hover:border-pink-400 hover:text-pink-600 hover:shadow-2xl shadow-xl hover:scale-105'}`}>
                  {/* Icon with enhanced effects */}
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-50 ${isDarkMode ? 'bg-cyan-400' : 'bg-pink-500'}`}></div>
                    <Upload size={18} className={`relative icon-3d group-hover:scale-125 group-hover:-translate-y-1 transition-all duration-300 ${isDarkMode ? 'text-cyan-300' : 'text-pink-600'}`} strokeWidth={2.5} />
                  </div>
                  <span className="hidden sm:inline relative z-10">{t.upload}</span>
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-lg"></div>
                </button>
              )}
              
              <button onClick={handleOpenExport} disabled={!imageSrc} className={`btn-magnetic flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all duration-300 relative group overflow-hidden ${imageSrc ? 'hover-float active:scale-95 btn-ripple ' + (isDarkMode ? 'font-tech uppercase tracking-widest rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border-2 border-gray-600 hover:border-gray-500 shadow-lg' : 'rounded-2xl btn-gradient-pink text-white glow-pink border-2 border-pink-300/50 hover:border-pink-200 shadow-2xl border-glow') : 'rounded-2xl dark:rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'}`}>
                <span className="hidden sm:inline relative z-10">{t.download}</span>
                {/* Enhanced Download Icon */}
                <div className="relative">
                  {imageSrc && <div className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 ${isDarkMode ? 'bg-white' : 'bg-white'}`}></div>}
                  <Download size={18} className={`relative icon-3d group-hover:scale-125 group-hover:translate-y-1 transition-all duration-300 ${imageSrc ? (isDarkMode ? 'text-white' : 'text-white') : ''}`} strokeWidth={2.5} />
                </div>
                {imageSrc && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>}
              </button>
            </div>
          </nav>
        </div>

        <div className="flex-1 flex overflow-hidden relative mt-2 mx-6 mb-6 gap-6">
          {/* === FLOATING SIDEBAR === */}
          <div className={`
             w-[360px] flex-shrink-0 flex flex-col z-40 transition-all duration-500 animate-fade-in relative
             glass-premium card-depth ${isDarkMode ? 'bg-[#0A0A0A]/85 border-2 border-gray-800 hover:border-gray-700 card-premium' : 'bg-white/90 border-2 border-pink-200/60 shadow-premium-light hover:border-pink-300/80 card-premium-light ambient-glow-light'} 
             rounded-[24px] overflow-hidden
          `}>
             {/* Top shine effect */}
             <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${isDarkMode ? 'via-gray-700/50' : 'via-pink-400/60'} to-transparent`}></div>
             
             {/* Corner accent with sparkle */}
             <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.6)]' : 'bg-gradient-to-br from-pink-400 to-rose-500 shadow-[0_0_12px_rgba(236,72,153,0.9)]'} animate-pulse`}>
               {!isDarkMode && <div className="absolute inset-0 rounded-full bg-white/50 animate-ping"></div>}
             </div>
             
             {/* Side gradient accent for light mode */}
             {!isDarkMode && (
               <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-pink-400/50 to-transparent"></div>
             )}
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
                onReplaceImage={handleReplaceImage}
                originalImageBackup={originalImageBackup}
                onRestoreOriginal={handleRestoreOriginal}
             />
          </div>

          {/* === CANVAS AREA === */}
          <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden gap-4">
             {/* Spotlight effect */}
             {imageSrc && <div className="spotlight"></div>}
             {/* Floating Zoom Controls */}
             {imageSrc && (
               <div className={`absolute bottom-8 right-8 z-30 flex gap-3 animate-fade-in`}>
                  <div className={`flex items-center gap-1 p-2 glass-premium card-depth ${isDarkMode ? 'bg-black/90 border border-white/10 rounded-xl shadow-premium-dark hover:border-white/20 ambient-glow-dark' : 'bg-white/95 rounded-2xl shadow-premium-light border border-pink-200/70 hover:border-pink-300 ambient-glow-light'} transition-all duration-300 border-glow`}>
                    <button 
                        onMouseDown={() => setIsComparing(true)} 
                        onMouseUp={() => setIsComparing(false)} 
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        className="p-3 hover:bg-pink-100 dark:hover:bg-cyan-500/20 rounded-xl text-pink-500 dark:text-cyan-400 transition-all hover-float active:scale-95 relative group icon-gradient hover-scale btn-ripple overflow-hidden"
                    >
                        <div className="relative">
                          <div className={`absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-50 ${isDarkMode ? 'bg-cyan-400' : 'bg-pink-500'}`}></div>
                          <Eye size={22} className="icon-3d relative" strokeWidth={2.5} />
                        </div>
                        <span className="absolute bottom-full mb-3 right-0 whitespace-nowrap bg-black dark:bg-white text-white dark:text-black text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">{t.compare}</span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1"></div>
                    <button onClick={handleZoomOut} className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-700 dark:text-gray-200 transition-all hover-float active:scale-95 relative group icon-gradient hover-scale" title={t.zoomOut}>
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-40 bg-gray-500"></div>
                        <ZoomOut size={22} className="icon-3d relative" strokeWidth={2.5} />
                      </div>
                    </button>
                    <button onClick={handleFitScreen} className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-700 dark:text-gray-200 transition-all hover:scale-110 active:scale-95 relative group icon-gradient" title={t.fitScreen}>
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-40 bg-gray-500"></div>
                        <Maximize size={22} className="icon-3d relative" strokeWidth={2.5} />
                      </div>
                    </button>
                    <button onClick={handleZoomIn} className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-gray-700 dark:text-gray-200 transition-all hover:scale-110 active:scale-95 relative group icon-gradient" title={t.zoomIn}>
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-40 bg-gray-500"></div>
                        <ZoomIn size={22} className="icon-3d relative" strokeWidth={2.5} />
                      </div>
                    </button>
                  </div>
               </div>
             )}

             <div className={`
                flex-1 relative rounded-[24px] overflow-hidden transition-all duration-500
                ${!imageSrc ? 'bg-transparent' : (isDarkMode ? 'bg-[#080808]/50 border border-white/5 shadow-premium-dark glass-premium' : 'bg-white/40 border border-pink-200/50 shadow-premium-light glass-premium hover:border-pink-300/60')}
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