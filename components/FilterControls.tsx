
import React, { useState } from 'react';
import { FilterState, HistogramData, TextLayer, StickerLayer, FrameType, BrushSettings } from '../types';
import { Translation, Language } from '../translations';
import { Sun, Contrast, EyeOff, RotateCw, FlipHorizontal, Droplets, Sliders, ChevronDown, Layers, Crop, Palette, Aperture, Wand2, Type, Sparkles, Undo2, Redo2, RotateCcw, Thermometer, Tv, BoxSelect, Activity, Trash2, Type as TypeIcon, Bold, Italic, Sticker, Image as ImageIcon, Frame, PenTool, LayoutTemplate, ArrowUp, ArrowDown } from 'lucide-react';
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
  setActiveTextId: (id: string | null) => void;
  textLayers: TextLayer[];
  onUpdateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
  onDeleteText: (id: string) => void;
  
  // Creative Props
  onApplyPreset: (filters: Partial<FilterState>) => void;
  onAddSticker: (emoji: string) => void;
  activeFrame: FrameType;
  onSetFrame: (frame: FrameType) => void;
  
  // Brush Props
  brushSettings: BrushSettings;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  onToggleBrush: (enabled: boolean) => void;
  onClearDrawings: () => void;
  
  // Layer Props
  activeStickerId: string | null;
  setActiveStickerId: (id: string | null) => void;
  stickers: StickerLayer[];
  onMoveLayer: (id: string, type: 'text' | 'sticker', direction: 'up' | 'down') => void;
  onDeleteSticker: (id: string) => void;
  
  // Unified Layer Order
  layerOrder?: {id: string, type: 'text' | 'sticker'}[];
}

export const FilterControls: React.FC<FilterControlsProps> = ({ 
  filters, setFilters, onReset, t, language, isCropping, setIsCropping, cropParams, setCropParams, onApplyCrop, onAddToHistory, currentImageBase64, onUndo, onRedo, canUndo, canRedo, histogramData, onRemoveImage, activeTab, setActiveTab, onAddText, activeTextId, setActiveTextId, textLayers, onUpdateTextLayer, onDeleteText,
  onApplyPreset, onAddSticker, activeFrame, onSetFrame,
  brushSettings, setBrushSettings, onToggleBrush, onClearDrawings,
  activeStickerId, setActiveStickerId, stickers, onMoveLayer, onDeleteSticker,
  layerOrder = []
}) => {
  // Manual Tools Sections
  const [sections, setSections] = useState({
    adjustments: true,
    effects: false,
    pro: false,
    transform: false
  });

  // Creative Tools Sections
  const [creativeSections, setCreativeSections] = useState({
    smartCrop: true,
    brush: false,
    filters: true,
    stickers: false,
    frames: false,
    layers: true
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCreativeSection = (section: keyof typeof creativeSections) => {
    setCreativeSections(prev => ({ ...prev, [section]: !prev[section] }));
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
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-pink-500 dark:group-hover:text-cyan-400 transition-colors">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
            <span className="dark:font-tech dark:tracking-widest dark:uppercase dark:text-[10px]">{label}</span>
          </div>
          
          <div className={`
             flex items-center justify-center min-w-[48px] px-2 py-1 gap-0.5
             dark:font-tech dark:bg-black/40 dark:text-cyan-400 dark:border dark:border-white/10 dark:rounded-md
             bg-white/80 text-gray-600 rounded-full border border-gray-200/60 shadow-sm backdrop-blur-sm transition-all
          `}>
            <input 
              type="number"
              value={Math.round(value)}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-full bg-transparent text-center text-[10px] font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {suffix && <span className="text-[8px] opacity-60 font-bold pointer-events-none select-none">{suffix}</span>}
          </div>
        </div>
        
        <div className="relative h-5 flex items-center group/slider">
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
          
          {/* Custom Track Background */}
          <div className="absolute w-full h-1 dark:h-[1px] bg-gray-200 dark:bg-white/10 rounded-full dark:rounded-none overflow-visible pointer-events-none transition-all">
            {/* Active Fill */}
            <div 
              className="h-full bg-pink-500 dark:bg-cyan-500 transition-all duration-75 rounded-full dark:rounded-none shadow-[0_0_10px_rgba(236,72,153,0.5)] dark:shadow-[0_0_10px_rgba(6,182,212,0.6)]"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionHeader = (title: string, icon: React.ReactNode, isOpen: boolean, onClick: () => void) => (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center justify-between py-3 px-4 -mx-2 mb-1 group focus:outline-none transition-all duration-300
        hover:bg-white/60 dark:hover:bg-white/5 hover:scale-[1.01] rounded-xl dark:rounded-lg
        ${isOpen ? 'bg-white/40 dark:bg-white/5' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg dark:rounded-sm bg-white dark:bg-transparent text-gray-400 dark:text-gray-500 group-hover:text-pink-500 dark:group-hover:text-cyan-400 shadow-sm dark:shadow-none transition-colors`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}
        </div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 dark:font-tech group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {title}
        </h3>
      </div>
      <ChevronDown 
        size={14} 
        className={`text-gray-300 dark:text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} group-hover:text-pink-400 dark:group-hover:text-cyan-400`} 
      />
    </button>
  );

  // === RENDER TEXT EDITING PANEL ===
  const renderTextPanel = () => {
    const activeText = textLayers.find(l => l.id === activeTextId);
    return (
      <div className="h-full animate-fade-in space-y-6 p-2 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onAddText('heading')} className="py-6 px-3 bg-gray-900 dark:bg-cyan-950/30 text-white dark:text-cyan-300 rounded-2xl dark:rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-black dark:hover:bg-cyan-900/50 hover:-translate-y-0.5 shadow-lg dark:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all dark:font-tech uppercase dark:border dark:border-cyan-500/30 dark:tracking-widest">
            <TypeIcon size={24} strokeWidth={2.5} />
            <span className="text-[10px] font-bold">{t.addHeading}</span>
          </button>
          <button onClick={() => onAddText('body')} className="py-6 px-3 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-2xl dark:rounded-lg flex flex-col items-center justify-center gap-2 border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:-translate-y-0.5 shadow-sm transition-all dark:font-tech uppercase dark:tracking-widest">
             <TypeIcon size={18} />
             <span className="text-[10px] font-bold">{t.addBody}</span>
          </button>
        </div>

        {activeText ? (
          <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-white/5">
             <div className="space-y-2">
               <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase tracking-widest ml-1">{t.textContent}</label>
               <input 
                 type="text"
                 value={activeText.text}
                 onChange={(e) => onUpdateTextLayer(activeText.id, { text: e.target.value })}
                 className="w-full p-3 bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl dark:rounded-md focus:outline-none focus:border-pink-400 dark:focus:border-cyan-400 dark:text-white text-sm font-medium transition-colors"
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase tracking-widest ml-1">{t.textColor}</label>
                 <div className="flex items-center gap-2">
                    <div className="w-full h-10 rounded-xl dark:rounded-md border border-gray-200 dark:border-white/10 overflow-hidden relative cursor-pointer hover:scale-105 transition-transform shadow-sm">
                        <input type="color" value={activeText.color} onChange={(e) => onUpdateTextLayer(activeText.id, { color: e.target.value })} className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer border-0 p-0" />
                    </div>
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase tracking-widest ml-1">{t.textStyle}</label>
                 <div className="flex bg-gray-100/80 dark:bg-white/5 rounded-xl dark:rounded-md p-1">
                    <button onClick={() => onUpdateTextLayer(activeText.id, { fontWeight: activeText.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`flex-1 py-1.5 flex justify-center rounded-lg dark:rounded-sm transition-all ${activeText.fontWeight === 'bold' ? 'bg-white dark:bg-cyan-900/50 shadow-sm text-black dark:text-cyan-300' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                      <Bold size={16} />
                    </button>
                    <button onClick={() => onUpdateTextLayer(activeText.id, { fontStyle: activeText.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`flex-1 py-1.5 flex justify-center rounded-lg dark:rounded-sm transition-all ${activeText.fontStyle === 'italic' ? 'bg-white dark:bg-cyan-900/50 shadow-sm text-black dark:text-cyan-300' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                      <Italic size={16} />
                    </button>
                 </div>
               </div>
             </div>
             <div className="space-y-3">
               <div className="flex justify-between px-1">
                 <label className="text-[9px] font-bold text-gray-400 dark:text-gray-500 dark:font-tech uppercase tracking-widest">{t.fontSize}</label>
                 <span className="text-[10px] font-bold text-gray-700 dark:text-white">{activeText.fontSize}px</span>
               </div>
               <input type="range" min={12} max={200} value={activeText.fontSize} onChange={(e) => onUpdateTextLayer(activeText.id, { fontSize: Number(e.target.value) })} className="w-full accent-pink-500 dark:accent-cyan-500" />
             </div>
             <div className="pt-4">
               <button onClick={() => onDeleteText(activeText.id)} className="w-full py-3 rounded-xl dark:rounded-md border border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 dark:font-tech uppercase tracking-wide">
                 <Trash2 size={14} /> {t.deleteText}
               </button>
             </div>
          </div>
        ) : (
          <div className="pt-12 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-600">
             <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4 border border-dashed border-gray-200 dark:border-white/10">
                <BoxSelect size={24} className="opacity-50" />
             </div>
             <p className="text-xs font-medium dark:font-tech">{t.noTextSelected}</p>
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
      <div className="p-2 space-y-2 animate-fade-in pb-20 pt-4">
         {/* Smart Resize Shortcuts */}
         <div>
            {renderSectionHeader(t.smartCrop, <LayoutTemplate size={14} />, creativeSections.smartCrop, () => toggleCreativeSection('smartCrop'))}
            {creativeSections.smartCrop && (
                <div className="pl-2 pr-1 animate-slide-down">
                    <div className="grid grid-cols-3 gap-2 pt-2 pb-4">
                        {[
                            { label: t.coverFB, val: 820/312, icon: <LayoutTemplate size={14}/>, color: 'hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50' },
                            { label: t.postIG, val: 1, icon: <ImageIcon size={14}/>, color: 'hover:text-pink-500 hover:border-pink-200 hover:bg-pink-50' },
                            { label: t.storyIG, val: 9/16, icon: <LayoutTemplate size={14} className="rotate-90"/>, color: 'hover:text-purple-500 hover:border-purple-200 hover:bg-purple-50' },
                            { label: t.thumbYT, val: 16/9, icon: <Tv size={14}/>, color: 'hover:text-red-500 hover:border-red-200 hover:bg-red-50' },
                            { label: t.portrait, val: 3/4, icon: <ImageIcon size={14}/>, color: 'hover:text-emerald-500 hover:border-emerald-200 hover:bg-emerald-50' }
                        ].map((item, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => {
                                    setCropParams(prev => ({ ...prev, aspect: item.val }));
                                    setIsCropping(true);
                                }} 
                                className={`
                                    py-2.5 px-1 flex flex-col items-center gap-1.5 text-[9px] 
                                    bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10
                                    transition-all duration-300 rounded-xl dark:rounded-md 
                                    hover:-translate-y-0.5 hover:shadow-sm
                                    dark:hover:bg-cyan-900/20 dark:hover:text-cyan-400 dark:hover:border-cyan-500/30
                                    ${item.color}
                                    dark:font-tech uppercase tracking-wide
                                `}
                            >
                                {item.icon}
                                <span className="font-bold">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
         </div>

         <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

         {/* Brush Tool */}
         <div>
             {renderSectionHeader(t.brush, <PenTool size={14} />, creativeSections.brush, () => toggleCreativeSection('brush'))}
             {creativeSections.brush && (
                 <div className="pl-2 pr-1 animate-slide-down pb-4">
                    <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl dark:rounded-lg border border-white/50 dark:border-white/10 space-y-4 shadow-sm backdrop-blur-sm">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onToggleBrush(!brushSettings.isEnabled)}
                                className={`flex-1 py-2.5 rounded-xl dark:rounded-md text-[10px] font-bold dark:font-tech uppercase flex items-center justify-center gap-2 transition-all shadow-sm tracking-wide ${brushSettings.isEnabled ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white dark:bg-none dark:bg-cyan-600 dark:text-black shadow-pink-500/20' : 'bg-white text-gray-600 border border-gray-100 dark:bg-white/10 dark:text-gray-400 dark:border-transparent hover:bg-gray-50'}`}
                            >
                                {brushSettings.isEnabled ? t.stopDrawing : t.startDrawing}
                            </button>
                            <button 
                                onClick={onClearDrawings}
                                className="px-3 rounded-xl dark:rounded-md bg-white border border-red-100 text-red-500 dark:bg-red-900/20 dark:text-red-400 dark:border-transparent hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                                title={t.clearDrawing}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        
                        {brushSettings.isEnabled && (
                            <div className="space-y-4 pt-2 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">{t.brushColor}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#d946ef', '#06b6d4'].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setBrushSettings(prev => ({ ...prev, color: c }))}
                                                className={`w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm transition-transform hover:scale-110 ${brushSettings.color === c ? 'ring-2 ring-offset-2 ring-pink-400 dark:ring-cyan-400 scale-110' : ''}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <div className="relative w-6 h-6 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-transform shadow-sm border border-gray-200">
                                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-cyan-400"></div>
                                            <input 
                                                type="color" 
                                                value={brushSettings.color} 
                                                onChange={(e) => setBrushSettings(prev => ({...prev, color: e.target.value}))}
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase px-1 tracking-widest">
                                        <span>{t.brushSize}</span>
                                        <span>{brushSettings.size}px</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min={1} max={50} 
                                        value={brushSettings.size} 
                                        onChange={(e) => setBrushSettings(prev => ({...prev, size: Number(e.target.value)}))}
                                        className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
             )}
         </div>

         <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

         {/* Filters */}
         <div>
            {renderSectionHeader(t.filters, <Palette size={14} />, creativeSections.filters, () => toggleCreativeSection('filters'))}
            {creativeSections.filters && (
                <div className="pl-2 pr-1 animate-slide-down pb-4">
                    <div className="grid grid-cols-3 gap-3">
                        {PRESETS.map(preset => (
                            <button key={preset.id} onClick={() => onApplyPreset(preset.filterValues)} className="flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="w-full aspect-square rounded-2xl dark:rounded-md bg-gray-100 dark:bg-white/5 overflow-hidden border-2 border-transparent group-hover:border-pink-400 dark:group-hover:border-cyan-400 relative shadow-sm transition-all group-hover:scale-105 group-active:scale-95">
                                    {currentImageBase64 && (
                                        <img src={currentImageBase64} className="w-full h-full object-cover" style={{ filter: getCssStringFromFilter(preset.filterValues) }} />
                                    )}
                                </div>
                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 dark:font-tech uppercase tracking-wider group-hover:text-pink-500 dark:group-hover:text-cyan-400 transition-colors">
                                    {/* @ts-ignore */}
                                    {t[preset.nameKey]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
         </div>

         <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

         {/* Stickers */}
         <div>
            {renderSectionHeader(t.stickers, <Sticker size={14} />, creativeSections.stickers, () => toggleCreativeSection('stickers'))}
            {creativeSections.stickers && (
                <div className="pl-2 pr-1 animate-slide-down pb-4">
                    <div className="grid grid-cols-5 gap-2 bg-white/40 dark:bg-white/5 p-3 rounded-2xl dark:rounded-lg border border-white/50 dark:border-white/10">
                        {emojis.map(emoji => (
                            <button key={emoji} onClick={() => onAddSticker(emoji)} className="text-xl hover:scale-125 transition-transform p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/20 hover:shadow-sm">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
         </div>

         <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

         {/* Frames */}
         <div>
            {renderSectionHeader(t.frames, <Frame size={14} />, creativeSections.frames, () => toggleCreativeSection('frames'))}
            {creativeSections.frames && (
                <div className="pl-2 pr-1 animate-slide-down pb-4">
                    <div className="grid grid-cols-2 gap-2">
                        {frames.map(frame => (
                            <button 
                                key={frame.id} 
                                onClick={() => onSetFrame(frame.id)}
                                className={`py-3 px-2 rounded-xl dark:rounded-md text-[10px] font-bold dark:font-tech uppercase border transition-all tracking-wide ${activeFrame === frame.id ? 'bg-gray-900 text-white dark:bg-cyan-600 dark:text-black border-transparent shadow-md' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200'}`}
                            >
                                {frame.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
         </div>

         <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

         {/* Unified Layer Manager */}
         <div>
             {renderSectionHeader(t.layers, <Layers size={14} />, creativeSections.layers, () => toggleCreativeSection('layers'))}
             {creativeSections.layers && (
                <div className="pl-2 pr-1 animate-slide-down">
                    {layerOrder.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic pl-2 py-2">{t.noLayers}</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1 flex flex-col-reverse">
                            {/* We map in reverse because layerOrder is bottom-to-top (render order), but UI shows top-to-bottom */}
                            {layerOrder.map((item) => {
                                if (item.type === 'sticker') {
                                    const s = stickers.find(sticker => sticker.id === item.id);
                                    if (!s) return null;
                                    return (
                                        <div key={s.id} className={`flex items-center justify-between p-2 rounded-xl dark:rounded-md border transition-all ${activeStickerId === s.id ? 'border-pink-400 bg-pink-50/50 dark:border-cyan-400 dark:bg-cyan-900/20' : 'border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 hover:border-pink-200 dark:hover:border-white/20'}`}>
                                            <button onClick={() => setActiveStickerId(s.id)} className="flex items-center gap-3 flex-1 text-left">
                                                {s.type === 'image' ? <ImageIcon size={16} /> : <span className="text-lg leading-none ml-1">{s.content}</span>}
                                                <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.stickerLayer}</span>
                                            </button>
                                            <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                                                <button onClick={() => onMoveLayer(s.id, 'up')} className="p-1 hover:bg-gray-200 dark:hover:bg-white/20 rounded-md transition-colors"><ArrowUp size={12}/></button>
                                                <button onClick={() => onMoveLayer(s.id, 'down')} className="p-1 hover:bg-gray-200 dark:hover:bg-white/20 rounded-md transition-colors"><ArrowDown size={12}/></button>
                                                <button onClick={() => onDeleteSticker(s.id)} className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"><Trash2 size={12}/></button>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const l = textLayers.find(layer => layer.id === item.id);
                                    if (!l) return null;
                                    return (
                                        <div key={l.id} className={`flex items-center justify-between p-2 rounded-xl dark:rounded-md border transition-all ${activeTextId === l.id ? 'border-pink-400 bg-pink-50/50 dark:border-cyan-400 dark:bg-cyan-900/20' : 'border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 hover:border-pink-200 dark:hover:border-white/20'}`}>
                                            <button onClick={() => setActiveTextId(l.id)} className="flex items-center gap-3 flex-1 text-left overflow-hidden">
                                                <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500"><Type size={12} /></div>
                                                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{l.text}</span>
                                            </button>
                                            <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                                                <button onClick={() => onMoveLayer(l.id, 'up')} className="p-1 hover:bg-gray-200 dark:hover:bg-white/20 rounded-md transition-colors"><ArrowUp size={12}/></button>
                                                <button onClick={() => onMoveLayer(l.id, 'down')} className="p-1 hover:bg-gray-200 dark:hover:bg-white/20 rounded-md transition-colors"><ArrowDown size={12}/></button>
                                                <button onClick={() => onDeleteText(l.id)} className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"><Trash2 size={12}/></button>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}
                 </div>
             )}
         </div>
      </div>
    );
  };

  // === CROP MODE (Overlay) ===
  if (isCropping) {
    return (
      <div className="h-full flex flex-col animate-fade-in">
        <div className="p-5 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 dark:font-tech uppercase tracking-widest">
            <Crop size={16} className="text-pink-500 dark:text-cyan-400" /> {t.cropMode}
          </h3>
        </div>
        <div className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
             <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:font-tech">{t.smartCrop}</label>
             <div className="grid grid-cols-2 gap-2">
                {[
                    { label: t.coverFB, val: 820/312, icon: <LayoutTemplate size={14}/> },
                    { label: t.postIG, val: 1, icon: <ImageIcon size={14}/> },
                    { label: t.storyIG, val: 9/16, icon: <LayoutTemplate size={14} className="rotate-90"/> },
                    { label: t.thumbYT, val: 16/9, icon: <Tv size={14}/> },
                    { label: t.landscape, val: 16/9, icon: <ImageIcon size={14}/> },
                    { label: t.portrait, val: 4/3, icon: <ImageIcon size={14}/> }
                ].map((item, idx) => (
                    <button key={idx} onClick={() => setCropParams(prev => ({ ...prev, aspect: item.val }))} className={`py-3 px-3 flex items-center gap-3 text-[10px] transition-all ${cropParams.aspect === item.val ? 'bg-pink-500 text-white dark:bg-cyan-600 dark:text-black shadow-md' : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50'} rounded-xl dark:rounded-md dark:font-tech uppercase font-bold tracking-wide`}>
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
                <button onClick={() => setCropParams(prev => ({ ...prev, aspect: null }))} className={`col-span-2 py-3 text-[10px] font-bold border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-xl dark:rounded-md hover:bg-gray-50 dark:hover:bg-white/5 uppercase tracking-wide`}>{t.original}</button>
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:font-tech">{t.zoom}</label>
             <div className="relative h-6 flex items-center">
               <input type="range" min={1} max={3} step={0.1} value={cropParams.zoom} onChange={(e) => setCropParams(prev => ({ ...prev, zoom: Number(e.target.value) }))} className="w-full cursor-pointer z-20 appearance-none bg-transparent h-full" />
               <div className="absolute w-full h-1 dark:h-[2px] bg-gray-100 dark:bg-gray-800 rounded-full dark:rounded-none">
                 <div className="h-full bg-gray-800 dark:bg-cyan-500 rounded-full dark:rounded-none" style={{width: `${(cropParams.zoom - 1) / 2 * 100}%`}}></div>
               </div>
             </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-black/20">
          <button onClick={() => setIsCropping(false)} className="py-3.5 rounded-xl dark:rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5 dark:font-tech dark:uppercase dark:tracking-wider hover:shadow-sm transition-all">{t.cancel}</button>
          <button onClick={onApplyCrop} className="py-3.5 rounded-xl dark:rounded-md bg-gray-900 dark:bg-cyan-600 text-white dark:text-black text-xs font-bold shadow-lg shadow-gray-900/20 dark:shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:shadow-xl hover:-translate-y-0.5 transition-all dark:font-tech dark:uppercase dark:tracking-wider">{t.apply}</button>
        </div>
      </div>
    );
  }

  // === MAIN CONTROLS ===
  return (
    <div className="h-full flex flex-col relative">
      {/* Top Actions Bar */}
      <div className="px-5 py-4 flex items-center justify-between bg-white/20 dark:bg-white/5 backdrop-blur-sm sticky top-0 z-20 border-b border-white/40 dark:border-white/5">
         <div className="flex items-center gap-1">
            <button onClick={onUndo} disabled={!canUndo} title={t.undo} className={`p-2 rounded-lg dark:rounded-sm transition-all ${!canUndo ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : 'text-gray-600 dark:text-cyan-400 hover:bg-white dark:hover:bg-cyan-950/50 hover:text-indigo-600 dark:hover:text-cyan-200 hover:shadow-sm'}`}><Undo2 size={18} /></button>
            <button onClick={onRedo} disabled={!canRedo} title={t.redo} className={`p-2 rounded-lg dark:rounded-sm transition-all ${!canRedo ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : 'text-gray-600 dark:text-cyan-400 hover:bg-white dark:hover:bg-cyan-950/50 hover:text-indigo-600 dark:hover:text-cyan-200 hover:shadow-sm'}`}><Redo2 size={18} /></button>
         </div>
         <div className="flex items-center gap-2">
           {currentImageBase64 && (
             <button onClick={onRemoveImage} title={t.removeImage} className="p-2 rounded-full dark:rounded-sm text-red-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-900/40 dark:hover:text-red-400 dark:border dark:border-transparent dark:hover:border-red-500/50 transition-all shadow-sm"><Trash2 size={16} /></button>
           )}
           <button onClick={onReset} className="text-[9px] font-bold px-3 py-2 bg-white/60 dark:bg-white/5 rounded-lg hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all text-gray-500 dark:text-gray-400 dark:font-tech dark:uppercase tracking-wide flex items-center gap-1.5 shadow-sm"><RotateCcw size={10} /> {t.reset}</button>
         </div>
      </div>

      {/* FLOATING TAB DOCK */}
      <div className="px-4 py-4 z-10">
        <div className="flex bg-gray-200/50 dark:bg-black/40 p-1 rounded-2xl dark:rounded-lg shadow-inner relative backdrop-blur-sm">
          {/* Animated Slider Pill Logic (Simplified with state classes) */}
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
                flex-1 py-2.5 rounded-xl dark:rounded-md flex flex-col items-center justify-center gap-1 transition-all duration-300 relative
                ${activeTab === tab.id 
                  ? 'bg-white dark:bg-gray-800 text-pink-500 dark:text-cyan-400 shadow-sm shadow-gray-300/50 dark:shadow-black/50 scale-100 font-bold' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/30 dark:hover:bg-white/5 scale-95'}
              `}
            >
              {/* @ts-ignore */}
              <tab.icon size={16} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[8px] font-bold dark:font-tech uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 relative scroll-smooth">
        {activeTab === 'ai' && <div className="h-full animate-fade-in"><AIPanel currentImageBase64={currentImageBase64} t={t} language={language} setFilters={setFilters} onAddToHistory={onAddToHistory} setDetectedObjects={() => {}} onAddSticker={onAddSticker} /></div>}
        
        {activeTab === 'creative' && renderCreativePanel()}

        {activeTab === 'text' && renderTextPanel()}

        {activeTab === 'manual' && (
          <div className="px-5 py-2 space-y-5 animate-slide-up pb-20">
            {histogramData && (
                <div className="mb-4 animate-fade-in p-1 bg-white/50 dark:bg-black border border-white/60 dark:border-white/10 rounded-2xl dark:rounded-sm shadow-sm backdrop-blur-sm">
                    <Histogram data={histogramData} />
                </div>
            )}
            
            <div>
                {renderSectionHeader(t.adjustments, <Sun size={14} />, sections.adjustments, () => toggleSection('adjustments'))}
                {sections.adjustments && <div className="pl-2 pr-1 space-y-1 animate-slide-down origin-top">{renderSlider(t.brightness, <Sun />, filters.brightness, 0, 200, 'brightness', '%')}{renderSlider(t.contrast, <Contrast />, filters.contrast, 0, 200, 'contrast', '%')}{renderSlider(t.saturation, <Palette />, filters.saturation, 0, 200, 'saturation', '%')}{renderSlider(t.hue, <Type />, filters.hue, 0, 360, 'hue', '°')}</div>}
            </div>
            
            <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>
            
            <div>
                {renderSectionHeader(t.proTools, <Activity size={14} />, sections.pro, () => toggleSection('pro'))}
                {sections.pro && <div className="pl-2 pr-1 space-y-1 animate-slide-down origin-top">{renderSlider(t.temperature, <Thermometer />, filters.temperature, -100, 100, 'temperature', '')}{renderSlider(t.noise, <Tv />, filters.noise, 0, 100, 'noise', '')}{renderSlider(t.pixelate, <BoxSelect />, filters.pixelate, 0, 50, 'pixelate', 'px')}{renderSlider(t.threshold, <Layers />, filters.threshold, 0, 255, 'threshold', '')}</div>}
            </div>
            
            <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>
            
            <div>
                {renderSectionHeader(t.effects, <Wand2 size={14} />, sections.effects, () => toggleSection('effects'))}
                {sections.effects && <div className="pl-2 pr-1 space-y-1 animate-slide-down origin-top">{renderSlider(t.blur, <Droplets />, filters.blur, 0, 20, 'blur', 'px')}{renderSlider(t.vignette, <Aperture />, filters.vignette, 0, 100, 'vignette', '%')}{renderSlider(t.grayscale, <EyeOff />, filters.grayscale, 0, 100, 'grayscale', '%')}{renderSlider(t.sepia, <Layers />, filters.sepia, 0, 100, 'sepia', '%')}{renderSlider(t.invert, <RotateCw />, filters.invert, 0, 100, 'invert', '%')}</div>}
            </div>
            
            <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>
            
            <div>
              {renderSectionHeader(t.transform, <RotateCw size={14} />, sections.transform, () => toggleSection('transform'))}
              {sections.transform && (
                <div className="grid grid-cols-3 gap-3 py-4 animate-slide-down">
                  <button onClick={handleRotate} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl dark:rounded-lg text-gray-600 dark:text-gray-400 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-400 transition-all group shadow-sm hover:-translate-y-1"><RotateCw size={20} className="group-hover:rotate-90 transition-transform duration-500" /><span className="text-[9px] font-bold dark:font-tech dark:uppercase tracking-widest">{t.rotate}</span></button>
                  <button onClick={handleFlip} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl dark:rounded-lg transition-all group shadow-sm hover:-translate-y-1 border border-transparent ${filters.flipH ? 'bg-pink-100 text-pink-600 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-500/30' : 'bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-white/60 dark:border-white/10 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-400'}`}><FlipHorizontal size={20} /><span className="text-[9px] font-bold dark:font-tech dark:uppercase tracking-widest">{t.flipX}</span></button>
                  <button onClick={() => setIsCropping(true)} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl dark:rounded-lg text-gray-600 dark:text-gray-400 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-400 transition-all group shadow-sm hover:-translate-y-1"><Crop size={20} /><span className="text-[9px] font-bold dark:font-tech dark:uppercase tracking-widest">{t.crop}</span></button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
