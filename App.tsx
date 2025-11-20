
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Zap, Moon, Sun, Undo2, Redo2, RotateCcw } from 'lucide-react';
import { FilterControls } from './components/FilterControls';
import { CanvasEditor } from './components/CanvasEditor';
import { AIPanel } from './components/AIPanel';
import { FilterState, DEFAULT_FILTERS, HistogramData } from './types';
import { translations, Language } from './translations';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  
  // History State
  const [history, setHistory] = useState<FilterState[]>([DEFAULT_FILTERS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Crop State
  const [isCropping, setIsCropping] = useState(false);
  const [cropParams, setCropParams] = useState<{ zoom: number; aspect: number | null }>({ zoom: 1, aspect: null });
  const [cropTrigger, setCropTrigger] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  // --- History Management ---
  
  const handleAddToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(filters);
    
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }
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
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

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
    } else {
      setProcessedImage(base64);
    }
  }, [filters]);

  const handleApplyCrop = () => {
    setCropTrigger(prev => prev + 1);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'vi' : 'en');
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-screen overflow-hidden`}>
      <div className="h-full w-full flex flex-col bg-rose-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 transition-colors duration-500 font-sans">
        
        {/* === NAVBAR === */}
        <div className="pt-4 px-6 pb-2 dark:pt-0 dark:px-0 dark:pb-0 z-50">
          <nav className={`
            flex items-center justify-between 
            transition-all duration-500
            h-16 px-6
            bg-white/80 dark:bg-[#0A0A0A]/80 
            backdrop-blur-xl 
            border border-white/50 dark:border-b dark:border-x-0 dark:border-t-0 dark:border-white/10
            rounded-full dark:rounded-none
            shadow-lg shadow-pink-500/5 dark:shadow-none
          `}>
            {/* Logo Area */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-400 dark:bg-cyan-500 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                  <div className={`
                    relative w-9 h-9 flex items-center justify-center 
                    transition-all duration-300
                    ${isDarkMode 
                      ? 'rounded-sm bg-cyan-950/30 border border-cyan-500/30 text-cyan-400' 
                      : 'rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-md'}
                  `}>
                    <Zap size={isDarkMode ? 18 : 20} className={isDarkMode ? "drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" : ""} fill="currentColor" />
                  </div>
                </div>
                <h1 className={`
                  text-2xl tracking-tight font-bold
                  bg-clip-text text-transparent 
                  ${isDarkMode 
                    ? 'font-tech bg-gradient-to-r from-white to-gray-400 tracking-widest uppercase' 
                    : 'bg-gradient-to-r from-gray-800 to-gray-600'}
                `}>
                  SmartLens
                </h1>
              </div>
              
              <div className="hidden md:block h-5 w-px bg-gray-300 dark:bg-gray-800 mx-2"></div>
              
              <div className="hidden md:flex items-center gap-2">
                  {['File', 'View', 'Export'].map((item) => (
                    <button key={item} className={`
                      px-3 py-1.5 text-sm font-medium transition-colors
                      ${isDarkMode 
                        ? 'font-tech uppercase text-gray-400 hover:text-cyan-400 hover:bg-cyan-950/30 rounded-sm' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full'}
                    `}>
                      {item}
                    </button>
                  ))}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <div className={`
                flex items-center p-1 gap-1
                ${isDarkMode 
                  ? 'bg-black border border-white/10 rounded-sm' 
                  : 'bg-gray-100 rounded-full border border-gray-200'}
              `}>
                <button
                  onClick={toggleLanguage}
                  className={`
                    w-9 h-9 flex items-center justify-center text-xs font-bold transition-all
                    ${isDarkMode 
                      ? 'rounded-sm text-gray-400 hover:text-white hover:bg-white/10 font-tech' 
                      : 'rounded-full text-gray-500 hover:text-pink-600 hover:bg-white hover:shadow-sm'}
                  `}
                >
                  {language === 'en' ? 'VI' : 'EN'}
                </button>
                <button
                  onClick={toggleTheme}
                  className={`
                    w-9 h-9 flex items-center justify-center transition-all
                    ${isDarkMode 
                      ? 'rounded-sm text-cyan-400 hover:bg-cyan-950/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                      : 'rounded-full text-amber-500 hover:bg-white hover:shadow-sm'}
                  `}
                >
                  {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              {!imageSrc && (
                <button 
                  onClick={triggerUpload}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all
                    ${isDarkMode 
                      ? 'font-tech uppercase tracking-wide rounded-sm border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                      : 'rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md'}
                  `}
                >
                  <Upload size={18} />
                  <span className="hidden sm:inline">{t.upload}</span>
                </button>
              )}
              
              <button 
                onClick={handleDownload}
                disabled={!imageSrc}
                className={`
                  flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all transform active:scale-95
                  ${imageSrc 
                    ? isDarkMode
                      ? 'font-tech uppercase rounded-sm bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(8,145,178,0.6)]'
                      : 'rounded-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white shadow-lg shadow-pink-500/30' 
                    : 'rounded-full dark:rounded-sm bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}
                `}
              >
                <span className="hidden sm:inline">{t.download}</span>
                <Download size={18} />
              </button>
            </div>
          </nav>
        </div>

        {/* === MAIN WORKSPACE === */}
        <div className="flex-1 flex overflow-hidden relative mt-2 md:mt-4 mx-0 md:mx-4 mb-0 md:mb-4 rounded-t-3xl dark:rounded-none border-t border-x border-white/50 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-none bg-white/50 dark:bg-[#0A0A0A]">
          
          {/* Background Patterns */}
          <div className="absolute inset-0 pointer-events-none z-0">
             {isDarkMode ? (
               <>
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                 <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(6,182,212,0.05),transparent)]"></div>
               </>
             ) : (
               <>
                 <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70"></div>
                 <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-pink-50/50 to-transparent"></div>
               </>
             )}
          </div>

          {/* Left Sidebar - Tools & AI */}
          <aside className={`
             w-80 z-20 transition-transform duration-300 backdrop-blur-md
             border-r border-white/60 dark:border-white/5
             bg-white/60 dark:bg-[#0A0A0A]/90
             ${isDarkMode ? '' : 'rounded-tl-3xl'}
          `}>
            <FilterControls 
              filters={filters} 
              setFilters={setFilters} 
              onReset={handleResetAll}
              t={t}
              language={language}
              isCropping={isCropping}
              setIsCropping={setIsCropping}
              cropParams={cropParams}
              setCropParams={setCropParams}
              onApplyCrop={handleApplyCrop}
              onAddToHistory={handleAddToHistory}
              currentImageBase64={processedImage}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              histogramData={histogramData}
            />
          </aside>

          {/* Center - Canvas */}
          <main className="flex-1 relative overflow-hidden flex flex-col z-10">
            <div className="relative w-full h-full p-6 md:p-10 flex items-center justify-center">
                 {imageSrc ? (
                  <CanvasEditor 
                    imageSrc={imageSrc} 
                    filters={filters} 
                    onImageProcessed={handleImageProcessed}
                    t={t}
                    isCropping={isCropping}
                    cropParams={cropParams}
                    cropTrigger={cropTrigger}
                    onHistogramData={setHistogramData}
                  />
                ) : (
                  /* Empty State */
                  <div className="text-center animate-fade-in">
                     <div 
                       onClick={triggerUpload}
                       className={`
                         group cursor-pointer relative overflow-hidden p-1 transition-all duration-500
                         ${isDarkMode 
                            ? 'rounded-sm bg-gradient-to-br from-gray-800 to-gray-900 hover:from-cyan-900/40 hover:to-blue-900/40 border border-white/5 hover:border-cyan-500/50' 
                            : 'rounded-[2.5rem] bg-gradient-to-br from-white to-gray-50 hover:from-pink-50 hover:to-violet-50 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-pink-100 hover:-translate-y-1'}
                       `}
                     >
                        <div className={`
                          px-20 py-24 flex flex-col items-center transition-colors
                          ${isDarkMode ? 'bg-[#0F0F0F] rounded-sm' : 'bg-white/50 rounded-[2.2rem]'}
                        `}>
                            <div className={`
                              w-28 h-28 mb-8 flex items-center justify-center transition-all duration-300
                              ${isDarkMode 
                                ? 'rounded-sm bg-gray-900 border border-white/10 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                                : 'rounded-3xl bg-pink-50 text-pink-400 group-hover:scale-110 group-hover:rotate-3'}
                            `}>
                              <Upload size={48} className={`transition-colors ${isDarkMode ? 'text-gray-600 group-hover:text-cyan-400' : ''}`} />
                            </div>
                            <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${isDarkMode ? 'font-tech text-white tracking-wide uppercase' : 'text-gray-800'}`}>
                              {t.selectFromComputer}
                            </h2>
                            <p className={`max-w-xs leading-relaxed ${isDarkMode ? 'text-gray-500 font-tech text-sm' : 'text-gray-500 text-base'}`}>
                              {t.noImageDesc}
                            </p>
                        </div>
                     </div>
                  </div>
                )}
            </div>
          </main>

          {/* Right Sidebar Removed */}
        </div>
      </div>
    </div>
  );
};

export default App;
