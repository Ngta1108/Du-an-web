
import React, { useState } from 'react';
import { FilterState, HistogramData, TextLayer, StickerLayer, FrameType } from '../types';
import { Translation, Language } from '../translations';
import { Sun, Contrast, EyeOff, RotateCw, FlipHorizontal, Droplets, Sliders, ChevronDown, Layers, Crop, Palette, Aperture, Wand2, Type, Sparkles, Undo2, Redo2, RotateCcw, Thermometer, Tv, BoxSelect, Activity, Trash2, Type as TypeIcon, Bold, Italic, Sticker, Image as ImageIcon, Frame } from 'lucide-react';
import { AIPanel } from './AIPanel';
import { Histogram } from './Histogram';
import { PRESETS, getCssStringFromFilter } from '../presets';

interface FilterControlsProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
  t: Translation;
  language: Language;
  isCropping: boolean;
  setIsCropping: (val: boolean) => void;
  cropParams: { zoom: number; aspect: number | null };
  setCropParams: React.Dispatch<React.SetStateAction<{ zoom: number; aspect: number | null }>>;
  onApplyCrop: () => void;
  onAddToHistory: () => void;
  currentImageBase64: string | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  histogramData: HistogramData | null;
  onRemoveImage: () => void;
  activeTab: 'ai' | 'manual' | 'text' | 'creative';
  setActiveTab: (tab: 'ai' | 'manual' | 'text' | 'creative') => void;
  onAddText: (type: 'heading' | 'body') => void;
  activeTextId: string | null;
  textLayers: TextLayer[];
  onUpdateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
  onDeleteText: (id: string) => void;
  
  // New Creative Props
  onApplyPreset: (filters: Partial<FilterState>) => void;
  onAddSticker: (emoji: string) => void;
  activeFrame: FrameType;
  onSetFrame: (frame: FrameType) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({ 
  filters, setFilters, onReset, t, language, isCropping, setIsCropping, cropParams, setCropParams, onApplyCrop, onAddToHistory, currentImageBase64, onUndo, onRedo, canUndo, canRedo, histogramData, onRemoveImage, activeTab, setActiveTab, onAddText, activeTextId, textLayers, onUpdateTextLayer, onDeleteText,
  onApplyPreset, onAddSticker, activeFrame, onSetFrame
}) => {
  const [sections, setSections] = useState({
    adjustments: true,
    effects: false,
    pro: false,
    transform: false
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const updateFilter = (key: keyof FilterState, value: number | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRotate = () => {
    setFilters(prev => {
      const newState = { ...prev, rotate: (prev.rotate + 90) % 360 };
      setTimeout(onAddToHistory, 0);
      return newState;
    });
  };
  
  const handleFlip = () => {
    setFilters(prev => {
      const newState = { ...prev, flipH: !prev.flipH };
      setTimeout(onAddToHistory, 0);
      return newState;
    });
  };

  const renderSlider = (label: string, icon: React.ReactNode, value: number, min: number, max: number, key: keyof FilterState, suffix = "") => {
    const percentage = ((value - min) / (max - min)) * 100;
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        updateFilter(key, val);
      }
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val)) val = min;
      if (val < min) val = min;
      if (val > max) val = max;
      
      updateFilter(key, val);
      onAddToHistory();
    };

    return (
      <div className="group py-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-pink-500 dark:group-hover:text-cyan-400 transition-colors">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
            <span className="dark:font-tech dark:tracking-wide dark:uppercase dark:text-sm">{label}</span>
          </div>
          
          <div className={`
             flex items-center justify-center min-w-[48px] px-2 py-1 gap-0.5
             dark:font-tech dark:bg-cyan-950/30 dark:text-cyan-400 dark:border dark:border-cyan-900/50 dark:rounded-sm
             bg-white text-gray-500 rounded-full border border-gray-100 shadow-sm focus-within:border-pink-300 dark:focus-within:border-cyan-400 transition-colors
          `}>
            <input 
              type="number"
              value={Math.round(value)}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-full bg-transparent text-center text-xs font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {suffix && <span className="text-[10px] opacity-60 font-bold pointer-events-none select-none">{suffix}</span>}
          </div>
        </div>
        
        <div className="relative h-5 flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => updateFilter(key, Number(e.target.value))}
            onMouseUp={onAddToHistory}
            onTouchEnd={onAddToHistory}
            className="absolute w-full z-20 appearance-none bg-transparent h-full cursor-pointer"
          />
          
          <div className="absolute w-full h-1.5 dark:h-[2px] bg-gray-100 dark:bg-gray-800 rounded-full dark:rounded-none overflow-visible pointer-events-none">
            <div 
              className="h-full bg-pink-300 dark:bg-cyan-500/50 transition-all duration-75 rounded-full dark:rounded-none"
              style={{ width: `${percentage}%` }}
            ></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionHeader = (title: string, icon: React.ReactNode, isOpen: boolean, onClick: () => void) => (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center justify-between py-3.5 px-4 -mx-3 mb-2 group focus:outline-none transition-all
        hover:bg-white dark:hover:bg-white/5
        ${isOpen ? 'bg-white/50 dark:bg-white/5' : ''}
        rounded-2xl dark:rounded-none
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`text-gray-400 dark:text-gray-600 group-hover:text-pink-500 dark:group-hover:text-cyan-400 transition-colors`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 dark:font-tech group-hover:text-gray-800 dark:group-hover:text-white transition-colors">
          {title}
        </h3>
      </div>
      <ChevronDown 
        size={18} 
        className={`text-gray-300 dark:text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} group-hover:text-pink-400 dark:group-hover:text-cyan-400`} 
      />
    </button>
  );

  // === RENDER TEXT EDITING PANEL ===
  const renderTextPanel = () => {
    const activeText = textLayers.find(l => l.id === activeTextId);
    return (
      <div className="h-full animate-fade-in space-y-6 p-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onAddText('heading')} className="py-4 px-3 bg-gray-900 dark:bg-cyan-900/40 text-white dark:text-cyan-300 rounded-xl dark:rounded-sm flex flex-col items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all dark:font-tech uppercase dark:border dark:border-cyan-500/30">
            <TypeIcon size={24} strokeWidth={3} />
            <span className="text-[10px] font-bold tracking-wider">{t.addHeading}</span>
          </button>
          <button onClick={() => onAddText('body')} className="py-4 px-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl dark:rounded-sm flex flex-col items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all dark:font-tech uppercase">
             <TypeIcon size={18} />
             <span className="text-[10px] font-bold tracking-wider">{t.addBody}</span>
          </button>
        </div>

        {activeText ? (
          <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-white/5">
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase">{t.textContent}</label>
               <input 
                 type="text"
                 value={activeText.text}
                 onChange={(e) => onUpdateTextLayer(activeText.id, { text: e.target.value })}
                 className="w-full p-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl dark:rounded-sm focus:outline-none focus:border-pink-400 dark:focus:border-cyan-400 dark:text-white text-sm font-medium"
               />
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase">{t.textColor}</label>
                 <div className="flex items-center gap-2">
                    <input type="color" value={activeText.color} onChange={(e) => onUpdateTextLayer(activeText.id, { color: e.target.value })} className="w-10 h-10 rounded-lg dark:rounded-sm cursor-pointer border-0 p-0" />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase">{t.textStyle}</label>
                 <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg dark:rounded-sm p-1">
                    <button onClick={() => onUpdateTextLayer(activeText.id, { fontWeight: activeText.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`flex-1 py-2 flex justify-center rounded-md dark:rounded-sm transition-colors ${activeText.fontWeight === 'bold' ? 'bg-white dark:bg-cyan-900/50 shadow-sm text-black dark:text-cyan-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Bold size={16} />
                    </button>
                    <button onClick={() => onUpdateTextLayer(activeText.id, { fontStyle: activeText.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`flex-1 py-2 flex justify-center rounded-md dark:rounded-sm transition-colors ${activeText.fontStyle === 'italic' ? 'bg-white dark:bg-cyan-900/50 shadow-sm text-black dark:text-cyan-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      <Italic size={16} />
                    </button>
                 </div>
               </div>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between">
                 <label className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase">{t.fontSize}</label>
                 <span className="text-xs font-bold text-gray-700 dark:text-white">{activeText.fontSize}px</span>
               </div>
               <input type="range" min={12} max={200} value={activeText.fontSize} onChange={(e) => onUpdateTextLayer(activeText.id, { fontSize: Number(e.target.value) })} className="w-full accent-pink-500 dark:accent-cyan-500" />
             </div>
             <div className="pt-4">
               <button onClick={() => onDeleteText(activeText.id)} className="w-full py-3 rounded-xl dark:rounded-sm border border-red-200 dark:border-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-sm flex items-center justify-center gap-2 transition-colors dark:font-tech uppercase">
                 <Trash2 size={16} /> {t.deleteText}
               </button>
             </div>
          </div>
        ) : (
          <div className="pt-10 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-600">
             <BoxSelect size={48} className="mb-3 opacity-50" />
             <p className="text-sm font-medium dark:font-tech">{t.noTextSelected}</p>
          </div>
        )}
      </div>
    );
  };

  // === RENDER CREATIVE MODE ===
  const renderCreativePanel = () => {
    const emojis = ['😀','😂','😍','😎','😭','😡','👍','👎','❤️','🔥','✨','🌈','🎉','📷','💡','🎨','🚀','🐱','🐶','🍕'];
    const frames: {id: FrameType, label: string}[] = [
        { id: 'none', label: t.frameNone },
        { id: 'white', label: t.frameWhite },
        { id: 'polaroid', label: t.framePolaroid },
        { id: 'film', label: t.frameFilm },
        { id: 'neon', label: t.frameNeon },
        { id: 'wood', label: t.frameWood }
    ];

    return (
      <div className="p-4 space-y-8 animate-fade-in pb-20">
         {/* Filters (Moved Here) */}
         <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase flex items-center gap-2">
                <Palette size={14} /> {t.filters}
            </h3>
            <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(preset => (
                    <button key={preset.id} onClick={() => onApplyPreset(preset.filterValues)} className="flex flex-col items-center gap-1 group">
                         <div className="w-full aspect-square rounded-lg dark:rounded-sm bg-gray-100 dark:bg-white/5 overflow-hidden border border-transparent hover:border-pink-400 dark:hover:border-cyan-400 relative">
                             {currentImageBase64 && (
                                 <img src={currentImageBase64} className="w-full h-full object-cover" style={{ filter: getCssStringFromFilter(preset.filterValues) }} />
                             )}
                         </div>
                         <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 dark:font-tech uppercase">{/* @ts-ignore */ t[preset.nameKey]}</span>
                    </button>
                ))}
            </div>
         </div>

         {/* Stickers */}
         <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase flex items-center gap-2">
                <Sticker size={14} /> {t.stickers}
            </h3>
            <div className="grid grid-cols-5 gap-2">
                {emojis.map(emoji => (
                    <button key={emoji} onClick={() => onAddSticker(emoji)} className="text-2xl hover:scale-125 transition-transform p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                        {emoji}
                    </button>
                ))}
            </div>
         </div>

         {/* Frames */}
         <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase flex items-center gap-2">
                <Frame size={14} /> {t.frames}
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {frames.map(frame => (
                    <button 
                        key={frame.id} 
                        onClick={() => onSetFrame(frame.id)}
                        className={`py-3 px-2 rounded-lg dark:rounded-sm text-xs font-bold dark:font-tech uppercase border transition-all ${activeFrame === frame.id ? 'bg-gray-900 text-white dark:bg-cyan-600 dark:text-black border-transparent' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:bg-gray-100'}`}
                    >
                        {frame.label}
                    </button>
                ))}
            </div>
         </div>
      </div>
    );
  };

  // === CROP MODE (Overlay) ===
  if (isCropping) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-3 dark:font-tech uppercase tracking-wider">
            <Crop size={20} className="text-pink-500 dark:text-cyan-400" /> {t.cropMode}
          </h3>
        </div>
        <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech">{t.ratio}</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: t.original, val: null }, { label: t.square, val: 1 }, { label: t.landscape, val: 16/9 }, { label: t.portrait, val: 4/3 }].map((item) => (
                <button key={item.label} onClick={() => setCropParams(prev => ({ ...prev, aspect: item.val }))} className={`py-3 px-3 text-sm transition-all duration-200 ${cropParams.aspect === item.val ? 'bg-gray-900 text-white dark:bg-cyan-600 dark:text-black shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'} rounded-xl dark:rounded-sm dark:font-tech dark:uppercase`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
             <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech">{t.zoom}</label>
             <div className="relative h-6 flex items-center">
               <input type="range" min={1} max={3} step={0.1} value={cropParams.zoom} onChange={(e) => setCropParams(prev => ({ ...prev, zoom: Number(e.target.value) }))} className="w-full cursor-pointer z-20 appearance-none bg-transparent h-full" />
               <div className="absolute w-full h-1 dark:h-[1px] bg-gray-200 dark:bg-gray-700 rounded-full dark:rounded-none">
                 <div className="h-full bg-gray-800 dark:bg-cyan-500" style={{width: `${(cropParams.zoom - 1) / 2 * 100}%`}}></div>
               </div>
             </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-4">
          <button onClick={() => setIsCropping(false)} className="py-3.5 rounded-xl dark:rounded-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 dark:font-tech dark:uppercase">{t.cancel}</button>
          <button onClick={onApplyCrop} className="py-3.5 rounded-xl dark:rounded-sm bg-gray-900 dark:bg-cyan-600 text-white dark:text-black text-sm font-bold shadow-lg shadow-gray-900/20 dark:shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:shadow-xl transition-all dark:font-tech dark:uppercase">{t.apply}</button>
        </div>
      </div>
    );
  }

  // === MAIN CONTROLS ===
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-sm">
         <div className="flex items-center gap-1">
            <button onClick={onUndo} disabled={!canUndo} title={t.undo} className={`p-2 rounded-lg dark:rounded-sm transition-all ${!canUndo ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : 'text-gray-600 dark:text-cyan-400 hover:bg-white dark:hover:bg-cyan-950/50 hover:text-indigo-600 dark:hover:text-cyan-200'}`}><Undo2 size={18} /></button>
            <button onClick={onRedo} disabled={!canRedo} title={t.redo} className={`p-2 rounded-lg dark:rounded-sm transition-all ${!canRedo ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : 'text-gray-600 dark:text-cyan-400 hover:bg-white dark:hover:bg-cyan-950/50 hover:text-indigo-600 dark:hover:text-cyan-200'}`}><Redo2 size={18} /></button>
         </div>
         <div className="flex items-center gap-3">
           {currentImageBase64 && (
             <button onClick={onRemoveImage} title={t.removeImage} className="p-1.5 rounded-full dark:rounded-sm text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:border dark:border-transparent dark:hover:border-red-500/50 transition-all"><Trash2 size={16} /></button>
           )}
           <button onClick={onReset} className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors dark:font-tech dark:uppercase flex items-center gap-1"><RotateCcw size={12} />{t.reset}</button>
         </div>
      </div>

      {/* NAV TABS */}
      <div className="p-4 pb-0 flex gap-2 overflow-x-auto">
        {[
            { id: 'ai', icon: Sparkles, label: t.aiMagic },
            { id: 'creative', icon: Palette, label: t.creative },
            { id: 'manual', icon: Sliders, label: t.tools },
            { id: 'text', icon: Type, label: t.textTool }
        ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 min-w-[60px] py-3 rounded-xl dark:rounded-sm flex flex-col items-center justify-center gap-1 transition-all duration-300 relative overflow-hidden
                ${activeTab === tab.id 
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-cyan-400 shadow-lg scale-100 border border-gray-100 dark:border-cyan-500/30' 
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 scale-95 opacity-80'}
              `}
            >
              {/* @ts-ignore */}
              <tab.icon size={18} />
              <span className="text-[9px] font-bold dark:font-tech uppercase tracking-wider z-10 truncate w-full text-center px-1">{tab.label}</span>
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 relative">
        {activeTab === 'ai' && <div className="h-full animate-fade-in"><AIPanel currentImageBase64={currentImageBase64} t={t} language={language} setFilters={setFilters} onAddToHistory={onAddToHistory} /></div>}
        
        {activeTab === 'creative' && renderCreativePanel()}

        {activeTab === 'text' && renderTextPanel()}

        {activeTab === 'manual' && (
          <div className="p-6 pt-4 space-y-4 animate-slide-up">
            {histogramData && <div className="mb-6 animate-fade-in"><Histogram data={histogramData} /></div>}
            <div>{renderSectionHeader(t.adjustments, <Sun size={18} />, sections.adjustments, () => toggleSection('adjustments'))}{sections.adjustments && <div className="pl-2 pr-1 space-y-2 animate-slide-down origin-top">{renderSlider(t.brightness, <Sun />, filters.brightness, 0, 200, 'brightness', '%')}{renderSlider(t.contrast, <Contrast />, filters.contrast, 0, 200, 'contrast', '%')}{renderSlider(t.saturation, <Palette />, filters.saturation, 0, 200, 'saturation', '%')}{renderSlider(t.hue, <Type />, filters.hue, 0, 360, 'hue', '°')}</div>}</div>
            <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-4"></div>
            <div>{renderSectionHeader(t.proTools, <Activity size={18} />, sections.pro, () => toggleSection('pro'))}{sections.pro && <div className="pl-2 pr-1 space-y-2 animate-slide-down origin-top">{renderSlider(t.temperature, <Thermometer />, filters.temperature, -100, 100, 'temperature', '')}{renderSlider(t.noise, <Tv />, filters.noise, 0, 100, 'noise', '')}{renderSlider(t.pixelate, <BoxSelect />, filters.pixelate, 0, 50, 'pixelate', 'px')}{renderSlider(t.threshold, <Layers />, filters.threshold, 0, 255, 'threshold', '')}</div>}</div>
            <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-4"></div>
            <div>{renderSectionHeader(t.effects, <Wand2 size={18} />, sections.effects, () => toggleSection('effects'))}{sections.effects && <div className="pl-2 pr-1 space-y-2 animate-slide-down origin-top">{renderSlider(t.blur, <Droplets />, filters.blur, 0, 20, 'blur', 'px')}{renderSlider(t.vignette, <Aperture />, filters.vignette, 0, 100, 'vignette', '%')}{renderSlider(t.grayscale, <EyeOff />, filters.grayscale, 0, 100, 'grayscale', '%')}{renderSlider(t.sepia, <Layers />, filters.sepia, 0, 100, 'sepia', '%')}{renderSlider(t.invert, <RotateCw />, filters.invert, 0, 100, 'invert', '%')}</div>}</div>
            <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-4"></div>
            <div>
              {renderSectionHeader(t.transform, <RotateCw size={18} />, sections.transform, () => toggleSection('transform'))}
              {sections.transform && (
                <div className="grid grid-cols-3 gap-4 py-2 animate-slide-down">
                  <button onClick={handleRotate} className="flex flex-col items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl dark:rounded-sm text-gray-600 dark:text-gray-400 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-400 transition-all group"><RotateCw size={24} className="group-hover:rotate-90 transition-transform duration-500" /><span className="text-xs font-bold dark:font-tech dark:uppercase">{t.rotate}</span></button>
                  <button onClick={handleFlip} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl dark:rounded-sm transition-all group ${filters.flipH ? 'bg-pink-100 text-pink-600 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border dark:border-cyan-500/30' : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-400'}`}><FlipHorizontal size={24} /><span className="text-xs font-bold dark:font-tech dark:uppercase">{t.flipX}</span></button>
                  <button onClick={() => setIsCropping(true)} className="flex flex-col items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl dark:rounded-sm text-gray-600 dark:text-gray-400 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-400 transition-all group"><Crop size={24} /><span className="text-xs font-bold dark:font-tech dark:uppercase">{t.crop}</span></button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
