
import React, { useState, memo } from 'react';
import { Sparkles, Bot, Loader2, Wand2, RotateCcw, CheckCircle2, Sliders, FileText, Copy, Image as ImageIcon, ChevronLeft, Brain, MessageSquareHeart, Plus, ScanEye, Share2, Palette as PaletteIcon, Hash, Sticker, Maximize2, Aperture, Download } from 'lucide-react';
import { analyzeImage, generateImagePrompt, detectObjects, generateSocialCaption, extractColorPalette, createStickerFromImage } from '../services/geminiService';
import { upscaleImage, estimateUpscaleTime } from '../services/upscalerService';
import { applyAnimeFilter, applyCartoonFilter, applyMangaFilter } from '../services/animeFilterService';
import { AnalysisResult, FilterState, DetectedObject, SocialContent } from '../types';
import { Translation, Language } from '../translations';

interface AIPanelProps {
  currentImageBase64: string | null;
  t: Translation;
  language: Language;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onAddToHistory: () => void;
  setDetectedObjects: (objs: DetectedObject[]) => void;
  onAddSticker?: (content: string) => void;
  onReplaceImage?: (newImageBase64: string) => void;
}

type AgentType = 'enhancer' | 'promptGen' | 'scanner' | 'social' | 'palette' | 'stickerMaker' | 'upscaler' | 'anime' | null;

const AIPanelComponent: React.FC<AIPanelProps> = ({ currentImageBase64, t, language, setFilters, onAddToHistory, setDetectedObjects, onAddSticker, onReplaceImage }) => {
  const [activeAgent, setActiveAgent] = useState<AgentType>(null);
  
  // Enhancer State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingEnhance, setLoadingEnhance] = useState(false);
  const [applied, setApplied] = useState(false);

  // Prompt Gen State
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [objectsFound, setObjectsFound] = useState<number | null>(null);

  // Social State
  const [socialContent, setSocialContent] = useState<SocialContent | null>(null);
  const [loadingSocial, setLoadingSocial] = useState(false);

  // Palette State
  const [colors, setColors] = useState<string[]>([]);
  const [loadingPalette, setLoadingPalette] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Sticker State
  const [generatedSticker, setGeneratedSticker] = useState<string | null>(null);
  const [creatingSticker, setCreatingSticker] = useState(false);

  // Upscaler State
  const [selectedScale, setSelectedScale] = useState<2 | 3 | 4>(2);
  const [upscaling, setUpscaling] = useState(false);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{w: number, h: number} | null>(null);

  // Anime Filter State
  const [animeStyle, setAnimeStyle] = useState<'anime' | 'cartoon' | 'manga'>('anime');
  const [animeIntensity, setAnimeIntensity] = useState(70); // Lowered default for better results
  const [processingAnime, setProcessingAnime] = useState(false);
  const [animeResult, setAnimeResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!currentImageBase64) return;
    setLoadingEnhance(true);
    setApplied(false);
    try {
      const result = await analyzeImage(currentImageBase64, language);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEnhance(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!currentImageBase64) return;
    setLoadingPrompt(true);
    setGeneratedPrompt("");
    setCopied(false);
    try {
      const result = await generateImagePrompt(currentImageBase64, language);
      setGeneratedPrompt(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleScan = async () => {
    if (!currentImageBase64) return;
    setIsScanning(true);
    setObjectsFound(null);
    setDetectedObjects([]); // clear prev
    try {
        const objs = await detectObjects(currentImageBase64);
        setDetectedObjects(objs);
        setObjectsFound(objs.length);
    } catch (e) {
        console.error(e);
    } finally {
        setIsScanning(false);
    }
  };

  const handleSocial = async () => {
      if (!currentImageBase64) return;
      setLoadingSocial(true);
      try {
          const res = await generateSocialCaption(currentImageBase64, language);
          setSocialContent(res);
      } catch(e) {
          console.error(e);
      } finally {
          setLoadingSocial(false);
      }
  };

  const handlePalette = async () => {
      if (!currentImageBase64) return;
      setLoadingPalette(true);
      try {
          const res = await extractColorPalette(currentImageBase64);
          setColors(res);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingPalette(false);
      }
  };

  const handleCreateSticker = async () => {
      if (!currentImageBase64) return;
      setCreatingSticker(true);
      setGeneratedSticker(null);
      try {
          const res = await createStickerFromImage(currentImageBase64);
          setGeneratedSticker(res);
      } catch (e) {
          console.error(e);
      } finally {
          setCreatingSticker(false);
      }
  };

  const handleUpscale = async () => {
      if (!currentImageBase64) return;
      setUpscaling(true);
      setUpscaledImage(null);
      
      // Get original dimensions
      const img = new Image();
      img.src = currentImageBase64;
      await new Promise((resolve) => { img.onload = resolve; });
      setOriginalDimensions({ w: img.width, h: img.height });
      
      try {
          const result = await upscaleImage(currentImageBase64, selectedScale);
          setUpscaledImage(result);
      } catch (e) {
          console.error(e);
          alert('Upscaling failed. Please try a smaller image or lower scale.');
      } finally {
          setUpscaling(false);
      }
  };

  const handleApplyAnime = async () => {
      if (!currentImageBase64) return;
      setProcessingAnime(true);
      setAnimeResult(null);
      
      try {
          let result: string;
          
          if (animeStyle === 'anime') {
              result = await applyAnimeFilter(currentImageBase64, animeIntensity);
          } else if (animeStyle === 'cartoon') {
              result = await applyCartoonFilter(currentImageBase64);
          } else {
              result = await applyMangaFilter(currentImageBase64);
          }
          
          setAnimeResult(result);
      } catch (e) {
          console.error(e);
          alert('Anime filter failed. Please try again.');
      } finally {
          setProcessingAnime(false);
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyColor = (hex: string) => {
      navigator.clipboard.writeText(hex);
      setCopiedColor(hex);
      setTimeout(() => setCopiedColor(null), 1500);
  };

  const applyAiSettings = () => {
    if (analysis?.filterAdjustments) {
      setFilters(prev => {
        setTimeout(onAddToHistory, 0); 
        return {
          ...prev,
          ...analysis.filterAdjustments
        };
      });
      setApplied(true);
    }
  };

  const agents = [
    { 
      id: 'enhancer', 
      icon: <Sparkles size={24} />, 
      label: t.agentEnhancer,
      color: 'from-fuchsia-500 via-pink-500 to-rose-500 shadow-pink-400/40',
      darkColor: 'from-cyan-400 via-blue-500 to-indigo-500 shadow-cyan-500/40'
    },
    { 
      id: 'promptGen', 
      icon: <Brain size={24} />, 
      label: t.agentPrompt, 
      color: 'from-orange-400 via-amber-400 to-yellow-400 shadow-orange-400/40',
      darkColor: 'from-amber-300 via-orange-500 to-red-500 shadow-orange-500/40'
    },
    {
        id: 'scanner',
        icon: <ScanEye size={24} />,
        label: t.agentScanner,
        color: 'from-emerald-400 via-teal-400 to-cyan-400 shadow-emerald-400/40',
        darkColor: 'from-emerald-400 via-green-500 to-lime-500 shadow-emerald-500/40'
    },
    {
        id: 'social',
        icon: <MessageSquareHeart size={24} />,
        label: t.agentSocial,
        color: 'from-blue-400 via-indigo-400 to-violet-400 shadow-indigo-400/40',
        darkColor: 'from-indigo-400 via-purple-500 to-fuchsia-500 shadow-purple-500/40'
    },
    {
        id: 'palette',
        icon: <PaletteIcon size={24} />,
        label: t.agentPalette,
        color: 'from-rose-400 via-purple-400 to-blue-400 shadow-purple-400/40',
        darkColor: 'from-pink-500 via-rose-500 to-red-500 shadow-rose-500/40'
    },
    {
        id: 'stickerMaker',
        icon: <Sticker size={24} />,
        label: t.agentSticker,
        color: 'from-yellow-400 via-orange-400 to-red-400 shadow-orange-400/40',
        darkColor: 'from-yellow-500 via-amber-500 to-orange-600 shadow-amber-500/40'
    },
    {
        id: 'upscaler',
        icon: <Maximize2 size={24} />,
        label: t.agentUpscaler,
        color: 'from-violet-400 via-purple-400 to-fuchsia-400 shadow-purple-400/40',
        darkColor: 'from-violet-500 via-purple-600 to-fuchsia-600 shadow-purple-500/40'
    },
    {
        id: 'anime',
        icon: <Aperture size={24} />,
        label: t.agentAnime,
        color: 'from-pink-400 via-rose-400 to-red-400 shadow-pink-400/40',
        darkColor: 'from-pink-500 via-rose-500 to-red-600 shadow-rose-500/40'
    }
  ];

  const getAgentIcon = (id: AgentType) => {
      const a = agents.find(x => x.id === id);
      return a?.icon;
  };
  const getAgentLabel = (id: AgentType) => {
      const a = agents.find(x => x.id === id);
      return a?.label;
  };
  const getAgentColor = (id: AgentType) => {
    const a = agents.find(x => x.id === id);
    return a?.color;
  };
  const getAgentDarkColor = (id: AgentType) => {
    const a = agents.find(x => x.id === id);
    return a?.darkColor;
  };

  // === VIEW: AGENT SELECTION GRID ===
  if (activeAgent === null) {
    return (
      <div className="h-full flex flex-col p-4 animate-fade-in">
        <div className="mb-5 flex items-center gap-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/10 pb-2">
          <Bot size={14} strokeWidth={2.5} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest dark:font-tech">AI Magic Hub</span>
        </div>

        <div className="grid grid-cols-4 gap-4 stagger-children">
          {agents.map((agent, index) => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id as AgentType)}
              className="flex flex-col items-center gap-2.5 group relative hover-scale"
            >
              {/* Glow effect */}
              <div className={`
                absolute top-0 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500
                bg-gradient-to-br ${agent.color} dark:${agent.darkColor}
              `}></div>

              <div className={`
                w-16 h-16 flex items-center justify-center text-white
                bg-gradient-to-br ${agent.color} dark:${agent.darkColor}
                rounded-[22px] dark:rounded-xl
                transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                group-hover:scale-115 group-hover:-translate-y-3 group-active:scale-95
                border-2 border-white/40 dark:border-white/30 
                shadow-premium-light dark:shadow-premium-dark
                group-hover:shadow-2xl group-hover:rotate-3 z-10 relative overflow-hidden
                border-glow
              `}>
                {/* Glossy reflection - enhanced */}
                <div className="absolute inset-0 rounded-[22px] dark:rounded-xl bg-gradient-to-tr from-white/0 via-white/30 to-white/50 pointer-events-none"></div>
                
                {/* Shine effect on hover */}
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none"></div>
                
                {/* Inner glow */}
                <div className="absolute inset-2 rounded-[18px] dark:rounded-lg bg-white/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Icon with 3D effect */}
                <div className="relative z-10">
                  {React.cloneElement(agent.icon as React.ReactElement<any>, { 
                    className: "icon-3d transition-all duration-300 group-hover:scale-125 group-hover:rotate-12", 
                    strokeWidth: 2.5,
                    size: 28
                  })}
                </div>
                
                {/* Pulsing dot indicator */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full opacity-60 group-hover:opacity-100 animate-pulse"></div>
              </div>
              
              {/* Reflection Shadow - enhanced */}
              <div className={`
                 absolute top-14 w-12 h-3 rounded-[100%] blur-lg opacity-0 group-hover:opacity-80 transition-all duration-500
                 bg-gradient-to-r ${agent.color} dark:${agent.darkColor}
                 group-hover:scale-125
              `}></div>

              <span className="text-[9px] font-extrabold text-gray-700 dark:text-gray-200 dark:font-tech group-hover:text-pink-600 dark:group-hover:text-white transition-all duration-300 text-center leading-tight w-full px-1 z-20 group-hover:scale-105">
                {agent.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // === VIEW: AGENT DETAIL ===
  return (
    <div className="h-full flex flex-col">
      {/* Navigation Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 bg-white/30 dark:bg-black/20 backdrop-blur-sm">
        <button 
          onClick={() => {
              setActiveAgent(null);
              setDetectedObjects([]); // Reset detection overlay on exit
          }}
          className="p-2 rounded-xl dark:rounded-md bg-white dark:bg-white/5 hover:bg-pink-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-all hover:text-pink-500 dark:hover:text-white hover:-translate-x-0.5 border border-gray-100 dark:border-white/5 shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
            <div className={`
                w-8 h-8 rounded-xl dark:rounded-md flex items-center justify-center text-white shadow-md
                bg-gradient-to-br ${getAgentColor(activeAgent)} dark:${getAgentDarkColor(activeAgent)}
            `}>
                {activeAgent && getAgentIcon(activeAgent) ? React.cloneElement(getAgentIcon(activeAgent) as any, { size: 16 }) : null}
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-white dark:font-tech uppercase tracking-wide">
              {getAgentLabel(activeAgent)}
            </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar">
        {!currentImageBase64 ? (
           <div className="h-full flex flex-col items-center justify-center text-center opacity-60 pb-20">
             <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-[2rem] dark:rounded-none flex items-center justify-center mb-6 border border-gray-100 dark:border-white/10 animate-pulse">
                <Bot size={40} className="text-gray-300 dark:text-gray-600" />
             </div>
             <p className="text-sm font-bold text-gray-600 dark:text-gray-300 dark:font-tech max-w-[200px] leading-relaxed uppercase tracking-wider">
               {t.uploadToEnable}
             </p>
           </div>
        ) : (
          <>
            {/* === AGENT: ENHANCER === */}
            {activeAgent === 'enhancer' && (
              <div className="animate-fade-in">
                 {!analysis && !loadingEnhance && (
                  <WelcomeCard 
                    desc={t.aiPrompt} 
                    btnText={t.analyzeButton} 
                    onClick={handleAnalyze} 
                    icon={Sparkles} 
                    gradient="from-fuchsia-500 to-pink-500 dark:from-gray-700 dark:to-gray-800"
                  />
                )}
                {loadingEnhance && <LoadingState message={t.analyzing} />}
                {analysis && (
                  <div className="space-y-5 animate-slide-up pb-10">
                    {analysis.filterAdjustments && (
                      <div className="p-4 bg-gradient-to-br from-pink-50 to-white dark:from-gray-900/30 dark:to-transparent border border-pink-100 dark:border-gray-700/30 rounded-2xl dark:rounded-md shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-pink-600 dark:text-gray-300 dark:font-tech uppercase flex items-center gap-2"><Sliders size={14} /> Auto-Enhance</h4>
                        </div>
                        {applied ? (
                           <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold dark:font-tech py-3 bg-green-50 dark:bg-green-900/20 rounded-xl dark:rounded-none border border-green-100 dark:border-green-500/20"><CheckCircle2 size={16} />{t.aiApplied}</div>
                        ) : (
                          <button onClick={applyAiSettings} className="w-full py-3 rounded-xl dark:rounded-sm font-bold text-xs transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 dark:from-gray-700 dark:to-gray-800 text-white dark:font-tech dark:uppercase hover:-translate-y-0.5 shadow-lg shadow-pink-500/20 dark:shadow-gray-900/20"><Sparkles size={14} />{t.applyAi}</button>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-200 dark:font-tech ml-1">{t.description}</h4>
                      <div className="bg-white dark:bg-[#0F0F0F] p-4 rounded-2xl dark:rounded-md border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none"><p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed dark:font-tech font-medium">{analysis.description}</p></div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-200 dark:font-tech ml-1">{t.suggestedEdits}</h4>
                      <div className="grid gap-2">
                        {analysis.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm p-3.5 bg-white dark:bg-[#0F0F0F] text-gray-700 dark:text-gray-200 rounded-2xl dark:rounded-md border border-gray-100 dark:border-white/10 hover:border-pink-200 dark:hover:border-cyan-900/50 transition-colors">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-500 dark:bg-gray-400 shrink-0"></div><span className="dark:font-tech font-semibold text-xs">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleAnalyze} className="w-full py-3 text-xs font-bold text-gray-600 hover:text-pink-500 dark:text-gray-300 dark:hover:text-cyan-400 bg-transparent hover:bg-pink-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} strokeWidth={2.5} />{t.reAnalyze}</button>
                  </div>
                )}
              </div>
            )}

            {/* === AGENT: PROMPT GEN === */}
            {activeAgent === 'promptGen' && (
               <div className="animate-fade-in space-y-6">
                 {!generatedPrompt && !loadingPrompt && (
                    <WelcomeCard desc={t.promptDesc} btnText={t.generatePromptBtn} onClick={handleGeneratePrompt} icon={Brain} gradient="from-orange-400 to-amber-500 dark:from-amber-600 dark:to-orange-700" />
                 )}
                 {loadingPrompt && <LoadingState message={t.generating} />}
                 {generatedPrompt && (
                    <div className="animate-slide-up space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">{t.promptResult}</h4>
                        <button onClick={() => copyToClipboard(generatedPrompt)} className="text-xs flex items-center gap-1 text-orange-500 dark:text-amber-400 hover:underline dark:font-tech font-bold">{copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}{copied ? t.copied : t.copyToClipboard}</button>
                      </div>
                      <div className="relative group">
                        <textarea readOnly value={generatedPrompt} className="w-full h-48 p-4 text-sm leading-relaxed rounded-2xl dark:rounded-md bg-orange-50/50 dark:bg-[#0F0F0F] border border-orange-100 dark:border-amber-500/20 focus:outline-none text-gray-700 dark:text-gray-300 resize-none dark:font-tech custom-scrollbar selection:bg-orange-200 dark:selection:bg-amber-900" />
                      </div>
                      <button onClick={handleGeneratePrompt} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-orange-500 dark:text-gray-600 dark:hover:text-amber-400 bg-transparent hover:bg-orange-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                    </div>
                 )}
               </div>
            )}

            {/* === AGENT: SCANNER === */}
            {activeAgent === 'scanner' && (
                <div className="animate-fade-in space-y-6">
                    {!objectsFound && !isScanning && (
                        <WelcomeCard desc={t.scanDesc} btnText={t.startScan} onClick={handleScan} icon={ScanEye} gradient="from-emerald-400 to-teal-500 dark:from-emerald-600 dark:to-green-700" />
                    )}
                    {isScanning && <LoadingState message={t.scanning} />}
                    {objectsFound !== null && (
                        <div className="animate-slide-up space-y-4">
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-500/30 rounded-2xl dark:rounded-md text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400/30 animate-pulse"></div>
                                <ScanEye size={40} className="mx-auto mb-3 text-emerald-500 dark:text-emerald-400" />
                                <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-300 dark:font-tech">{objectsFound} {t.scanResult}</h4>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 opacity-80 font-medium">{objectsFound > 0 ? "Bounding boxes rendered on canvas" : t.noObjects}</p>
                            </div>
                            <button onClick={handleScan} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-emerald-500 dark:text-gray-600 dark:hover:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                        </div>
                    )}
                </div>
            )}

            {/* === AGENT: SOCIAL === */}
            {activeAgent === 'social' && (
                <div className="animate-fade-in space-y-6">
                    {!socialContent && !loadingSocial && (
                        <WelcomeCard desc={t.socialDesc} btnText={t.generateSocial} onClick={handleSocial} icon={MessageSquareHeart} gradient="from-indigo-400 to-violet-500 dark:from-indigo-600 dark:to-purple-700" />
                    )}
                    {loadingSocial && <LoadingState message={t.writing} />}
                    {socialContent && (
                        <div className="animate-slide-up space-y-6">
                             <div className="space-y-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">Captions</h4>
                                {socialContent.captions.map((cap, i) => (
                                    <div key={i} className="group relative p-4 bg-white dark:bg-[#0F0F0F] border border-gray-100 dark:border-white/10 rounded-2xl dark:rounded-md hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all hover:shadow-sm">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => copyToClipboard(cap)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-white/20 text-indigo-400 dark:text-indigo-300"><Copy size={14}/></button>
                                        </div>
                                        <span className="text-[9px] font-bold text-indigo-400 uppercase mb-1 block dark:font-tech tracking-wide">{i === 0 ? t.captionFun : (i === 1 ? t.captionDeep : t.captionMinimal)}</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:font-tech leading-relaxed pr-6">{cap}</p>
                                    </div>
                                ))}
                             </div>
                             <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1 flex items-center gap-1"><Hash size={12}/> Hashtags</h4>
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl dark:rounded-md border border-indigo-100 dark:border-indigo-500/20 text-sm text-indigo-600 dark:text-indigo-300 font-medium leading-loose">
                                    {socialContent.hashtags.map(h => <span key={h} className="mr-2 inline-block hover:text-indigo-800 hover:underline cursor-pointer transition-colors" onClick={() => copyToClipboard(h)}>{h}</span>)}
                                </div>
                             </div>
                             <button onClick={handleSocial} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-indigo-500 dark:text-gray-600 dark:hover:text-indigo-400 bg-transparent hover:bg-indigo-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                        </div>
                    )}
                </div>
            )}

            {/* === AGENT: PALETTE === */}
            {activeAgent === 'palette' && (
                <div className="animate-fade-in space-y-6">
                    {colors.length === 0 && !loadingPalette && (
                        <WelcomeCard desc={t.paletteDesc} btnText={t.extractColors} onClick={handlePalette} icon={PaletteIcon} gradient="from-rose-400 to-orange-400 dark:from-purple-600 dark:to-pink-600" />
                    )}
                    {loadingPalette && <LoadingState message={t.extracting} />}
                    {colors.length > 0 && (
                        <div className="animate-slide-up space-y-6">
                            <div className="grid grid-cols-1 gap-3">
                                {colors.map((hex, i) => (
                                    <button key={i} onClick={() => copyColor(hex)} className="group flex items-center gap-4 p-2 pr-4 bg-white dark:bg-[#0F0F0F] rounded-2xl dark:rounded-md border border-gray-100 dark:border-white/10 hover:border-rose-200 dark:hover:border-pink-500/30 transition-all hover:shadow-sm hover:-translate-x-1">
                                        <div className="w-14 h-14 rounded-xl dark:rounded-sm shadow-inner" style={{ backgroundColor: hex }}></div>
                                        <div className="flex-1 text-left">
                                            <p className="text-lg font-bold text-gray-800 dark:text-white font-mono tracking-tight">{hex}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase dark:font-tech tracking-wider group-hover:text-rose-400 dark:group-hover:text-pink-400 transition-colors">{copiedColor === hex ? t.hexCopied : "Click to copy"}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={handlePalette} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-rose-500 dark:text-gray-600 dark:hover:text-pink-400 bg-transparent hover:bg-rose-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                        </div>
                    )}
                </div>
            )}

            {/* === AGENT: STICKER MAKER === */}
            {activeAgent === 'stickerMaker' && (
                <div className="animate-fade-in space-y-6">
                    {!generatedSticker && !creatingSticker && (
                        <WelcomeCard desc={t.stickerDesc} btnText={t.createSticker} onClick={handleCreateSticker} icon={Sticker} gradient="from-yellow-400 to-orange-500 dark:from-amber-500 dark:to-orange-600" />
                    )}
                    {creatingSticker && <LoadingState message={t.creatingSticker} />}
                    {generatedSticker && (
                        <div className="animate-slide-up space-y-6">
                            <div className="p-6 bg-orange-50 dark:bg-amber-950/20 border border-orange-100 dark:border-amber-500/30 rounded-2xl dark:rounded-md text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-orange-400/30 animate-pulse"></div>
                                <h4 className="text-sm font-bold text-orange-700 dark:text-orange-300 dark:font-tech uppercase mb-4">{t.stickerResult}</h4>
                                <div className="flex justify-center">
                                    <img src={generatedSticker} alt="Generated Sticker" className="w-48 h-48 object-contain drop-shadow-xl" />
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    if (onAddSticker && generatedSticker) {
                                        onAddSticker(generatedSticker);
                                        setActiveAgent(null); // Close panel and go back to canvas
                                    }
                                }} 
                                className="w-full py-4 rounded-2xl dark:rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:-translate-y-1 dark:font-tech dark:uppercase"
                            >
                                <CheckCircle2 size={18} /> {t.addToCanvas}
                            </button>
                            <button onClick={handleCreateSticker} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-orange-500 dark:text-gray-600 dark:hover:text-orange-400 bg-transparent hover:bg-orange-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                        </div>
                    )}
                </div>
            )}

            {/* === AGENT: ANIME FILTER === */}
            {activeAgent === 'anime' && (
                <div className="animate-fade-in space-y-6">
                    {!animeResult && !processingAnime && (
                        <div className="space-y-6">
                            <div className="p-8 rounded-[24px] dark:rounded-lg border transition-all text-center bg-gradient-to-b from-white/80 to-white/20 dark:from-white/5 dark:to-transparent border-gray-100 dark:border-white/10 shadow-lg dark:shadow-none backdrop-blur-md">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl dark:rounded-md flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-pink-400 via-rose-400 to-red-400 dark:from-pink-500 dark:via-rose-500 dark:to-red-600">
                                    <Aperture size={32} />
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-8 leading-relaxed dark:font-tech">{t.animeDesc}</p>
                                
                                {/* Style Selection */}
                                <div className="space-y-3 mb-6">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech">{t.chooseStyle}</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['anime', 'cartoon', 'manga'] as const).map((style) => (
                                            <button 
                                                key={style}
                                                onClick={() => setAnimeStyle(style)}
                                                className={`py-4 rounded-xl dark:rounded-md text-xs font-bold transition-all dark:font-tech uppercase tracking-wide ${animeStyle === style ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg scale-105' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                                            >
                                                {style === 'anime' ? t.styleAnime : style === 'cartoon' ? t.styleCartoon : t.styleManga}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Intensity Slider (only for anime/cartoon) */}
                                {animeStyle !== 'manga' && (
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech">{t.intensity}</h4>
                                            <span className="text-xs font-bold text-pink-500 dark:text-rose-400">{animeIntensity}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="20" 
                                            max="100" 
                                            step="5"
                                            value={animeIntensity}
                                            onChange={(e) => setAnimeIntensity(Number(e.target.value))}
                                            className="w-full accent-pink-500 dark:accent-rose-500"
                                        />
                                    </div>
                                )}

                                <button 
                                    onClick={handleApplyAnime}
                                    className="w-full py-4 px-4 rounded-2xl dark:rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 dark:from-pink-500 dark:via-rose-500 dark:to-red-600 text-white shadow-xl hover:-translate-y-1 active:scale-95 hover:shadow-2xl dark:font-tech dark:uppercase dark:tracking-wider"
                                >
                                    {t.animeBtn} <Aperture size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                </button>
                            </div>
                        </div>
                    )}
                    {processingAnime && <LoadingState message={t.animeProcessing} />}
                    {animeResult && (
                        <div className="animate-slide-up space-y-6">
                            <div className="p-6 bg-pink-50 dark:bg-rose-950/20 border border-pink-100 dark:border-rose-500/30 rounded-2xl dark:rounded-md relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-pink-400/30 animate-pulse"></div>
                                <h4 className="text-sm font-bold text-pink-700 dark:text-rose-300 dark:font-tech uppercase mb-4 text-center">{t.animeResult}</h4>
                                
                                {/* Preview */}
                                <div className="bg-white dark:bg-black/40 rounded-xl dark:rounded-md p-3 overflow-hidden">
                                    <img src={animeResult} alt="Anime Filtered" className="w-full h-auto rounded-lg shadow-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => {
                                        if (animeResult && onReplaceImage) {
                                            onReplaceImage(animeResult);
                                            setActiveAgent(null);
                                        }
                                    }} 
                                    className="py-4 rounded-2xl dark:rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg hover:-translate-y-1 dark:font-tech dark:uppercase"
                                >
                                    <CheckCircle2 size={18} /> {t.applyAnime}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (animeResult) {
                                            const link = document.createElement('a');
                                            link.download = `anime-${animeStyle}.png`;
                                            link.href = animeResult;
                                            link.click();
                                        }
                                    }} 
                                    className="py-4 rounded-2xl dark:rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 bg-white dark:bg-white/10 border-2 border-pink-500 text-pink-500 dark:text-rose-400 hover:bg-pink-50 dark:hover:bg-white/20 dark:font-tech dark:uppercase"
                                >
                                    <Download size={18} /> {t.download}
                                </button>
                            </div>
                            <button onClick={handleApplyAnime} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-pink-500 dark:text-gray-600 dark:hover:text-rose-400 bg-transparent hover:bg-pink-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                        </div>
                    )}
                </div>
            )}

            {/* === AGENT: UPSCALER === */}
            {activeAgent === 'upscaler' && (
                <div className="animate-fade-in space-y-6">
                    {!upscaledImage && !upscaling && (
                        <div className="space-y-6">
                            <div className="p-8 rounded-[24px] dark:rounded-lg border transition-all text-center bg-gradient-to-b from-white/80 to-white/20 dark:from-white/5 dark:to-transparent border-gray-100 dark:border-white/10 shadow-lg dark:shadow-none backdrop-blur-md">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl dark:rounded-md flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-violet-400 via-purple-400 to-fuchsia-400 dark:from-violet-500 dark:via-purple-600 dark:to-fuchsia-600">
                                    <Maximize2 size={32} />
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-8 leading-relaxed dark:font-tech">{t.upscaleDesc}</p>
                                
                                {/* Scale Selection */}
                                <div className="space-y-3 mb-6">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech">{t.chooseScale}</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {([2, 3, 4] as const).map((scale) => (
                                            <button 
                                                key={scale}
                                                onClick={() => setSelectedScale(scale)}
                                                className={`py-4 rounded-xl dark:rounded-md text-sm font-bold transition-all dark:font-tech uppercase tracking-wide ${selectedScale === scale ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg scale-105' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                                            >
                                                {scale === 2 ? t.scale2x : scale === 3 ? t.scale3x : t.scale4x}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Estimated Time */}
                                {originalDimensions && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-6 dark:font-tech">
                                        {t.estimatedTime}: ~{estimateUpscaleTime(originalDimensions.w, originalDimensions.h, selectedScale)} {t.seconds}
                                    </div>
                                )}

                                <button 
                                    onClick={handleUpscale}
                                    className="w-full py-4 px-4 rounded-2xl dark:rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 group bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 dark:from-violet-500 dark:via-purple-600 dark:to-fuchsia-600 text-white shadow-xl hover:-translate-y-1 active:scale-95 hover:shadow-2xl dark:font-tech dark:uppercase dark:tracking-wider"
                                >
                                    {t.upscaleBtn} <Maximize2 size={18} className="group-hover:rotate-12 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}
                    {upscaling && <LoadingState message={t.upscaling} />}
                    {upscaledImage && (
                        <div className="animate-slide-up space-y-6">
                            <div className="p-6 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/30 rounded-2xl dark:rounded-md relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-purple-400/30 animate-pulse"></div>
                                <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 dark:font-tech uppercase mb-4 text-center">{t.upscaleResult}</h4>
                                
                                {/* Preview Comparison */}
                                <div className="space-y-3">
                                    <div className="bg-white dark:bg-black/40 rounded-xl dark:rounded-md p-3 overflow-hidden">
                                        <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 mb-2 dark:font-tech">{t.newSize}</p>
                                        <img src={upscaledImage} alt="Upscaled" className="w-full h-auto rounded-lg shadow-sm" />
                                    </div>
                                    
                                    {originalDimensions && (
                                        <div className="text-xs text-center text-gray-600 dark:text-gray-400 dark:font-tech">
                                            {t.originalSize}: {originalDimensions.w}×{originalDimensions.h} → {t.newSize}: {originalDimensions.w * selectedScale}×{originalDimensions.h * selectedScale}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => {
                                        if (upscaledImage && onReplaceImage) {
                                            onReplaceImage(upscaledImage);
                                            setActiveAgent(null);
                                        }
                                    }} 
                                    className="py-4 rounded-2xl dark:rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white shadow-lg hover:-translate-y-1 dark:font-tech dark:uppercase"
                                >
                                    <CheckCircle2 size={18} /> {t.applyUpscale}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (upscaledImage) {
                                            const link = document.createElement('a');
                                            link.download = `upscaled-${selectedScale}x.png`;
                                            link.href = upscaledImage;
                                            link.click();
                                        }
                                    }} 
                                    className="py-4 rounded-2xl dark:rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 bg-white dark:bg-white/10 border-2 border-purple-500 text-purple-500 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-white/20 dark:font-tech dark:uppercase"
                                >
                                    <Download size={18} /> {t.download}
                                </button>
                            </div>
                            <button onClick={handleUpscale} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-purple-500 dark:text-gray-600 dark:hover:text-purple-400 bg-transparent hover:bg-purple-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                        </div>
                    )}
                </div>
            )}
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-6 pb-4 pt-2">
        <p className="text-[9px] text-gray-300 dark:text-gray-700 tracking-widest font-bold dark:font-tech text-center uppercase opacity-60">
          {t.poweredBy}
        </p>
      </div>
    </div>
  );
};

// Memoized export for performance
export const AIPanel = memo(AIPanelComponent);

const WelcomeCard = ({ desc, btnText, onClick, icon: Icon, gradient }: any) => (
    <div className={`
        relative p-8 rounded-[26px] dark:rounded-xl border-2 transition-all duration-500 text-center group
        bg-gradient-to-b from-white/90 to-white/40 dark:from-white/8 dark:to-transparent 
        border-white/60 dark:border-white/15 shadow-2xl dark:shadow-xl backdrop-blur-xl
        hover:border-pink-200 dark:hover:border-cyan-500/40 hover:shadow-3xl hover:scale-[1.02]
        card-premium overflow-hidden
    `}>
        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
        
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-400 dark:via-gray-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className={`
             relative w-20 h-20 mx-auto mb-7 rounded-[22px] dark:rounded-xl flex items-center justify-center text-white shadow-2xl
             bg-gradient-to-br ${gradient} animate-gradient bg-[length:200%_auto]
             group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500
             border-2 border-white/40 overflow-hidden
        `}>
             {/* Glossy overlay */}
             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/60 opacity-70"></div>
             
             {/* Pulsing inner glow */}
             <div className="absolute inset-3 rounded-[16px] dark:rounded-lg bg-white/20 blur-md animate-pulse"></div>
             
             {/* Icon with enhanced 3D effect */}
             <Icon size={40} className="icon-3d relative z-10 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500" strokeWidth={2.5} />
             
             {/* Rotating ring */}
             <div className="absolute inset-0 border-2 border-white/30 rounded-[22px] dark:rounded-xl animate-spin opacity-0 group-hover:opacity-50" style={{animationDuration: '3s'}}></div>
             
             {/* Corner sparkles */}
             <div className="absolute top-2 right-2 w-2 h-2">
               <div className="absolute inset-0 bg-white rounded-full opacity-80 animate-ping"></div>
               <div className="absolute inset-0 bg-white rounded-full opacity-100"></div>
             </div>
        </div>
        
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-8 leading-relaxed dark:font-tech px-2 text-reveal">{desc}</p>
        
        <button onClick={onClick} className={`
            btn-magnetic relative w-full py-4 px-4 rounded-2xl dark:rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-3 group/btn
            bg-gradient-to-r ${gradient} text-white animate-gradient bg-[length:200%_auto]
            shadow-2xl hover:shadow-3xl hover:-translate-y-1.5 active:scale-95
            dark:font-tech dark:uppercase dark:tracking-wider
            border-2 border-white/30 overflow-hidden
        `}>
            <span className="relative z-10">{btnText}</span>
            
            {/* Enhanced icon with glow */}
            <div className="relative z-10">
              <div className="absolute inset-0 rounded-full blur-lg bg-white opacity-0 group-hover/btn:opacity-50 transition-opacity"></div>
              <Icon size={22} className="icon-3d relative group-hover/btn:rotate-12 group-hover/btn:scale-125 transition-all duration-300" strokeWidth={2.5} />
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
        </button>
    </div>
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-fade-in">
    <div className="relative">
      {/* Outer glow rings */}
      <div className="absolute inset-0 w-32 h-32 -left-6 -top-6">
        <div className="w-full h-full rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 dark:from-gray-600/30 dark:to-gray-700/30 animate-ping"></div>
      </div>
      <div className="absolute inset-0 w-28 h-28 -left-4 -top-4">
        <div className="w-full h-full rounded-full bg-gradient-to-r from-pink-400/20 to-rose-400/20 dark:from-gray-500/20 dark:to-gray-600/20 animate-ping" style={{animationDelay: '0.3s'}}></div>
      </div>
      
      {/* Main loader circle */}
      <div className="relative w-20 h-20 rounded-full dark:rounded-xl bg-gradient-to-br from-white to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center shadow-2xl border-2 border-pink-200 dark:border-gray-700 animate-float">
        {/* Spinning border gradient */}
        <div className="absolute inset-0 rounded-full dark:rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 animate-spin" style={{clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)'}}></div>
        </div>
        
        {/* Inner content */}
        <div className="relative z-10 bg-white dark:bg-black rounded-full dark:rounded-lg w-16 h-16 flex items-center justify-center">
          {/* Icon glow */}
          <div className="absolute inset-0 rounded-full blur-xl bg-pink-500 dark:bg-gray-600 opacity-30 animate-pulse"></div>
          
          {/* Main icon with 3D effect */}
          <Sparkles size={36} className="icon-3d text-pink-500 dark:text-gray-400 animate-pulse relative z-10 icon-float" strokeWidth={2.5} />
          
          {/* Small orbiting particles */}
          <div className="absolute inset-0">
            <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-pink-400 dark:bg-gray-500 animate-ping"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-rose-400 dark:bg-blue-300 animate-ping" style={{animationDelay: '0.5s'}}></div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Loading text with shimmer */}
    <div className="relative">
      <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 dark:from-cyan-400 dark:via-blue-400 dark:to-cyan-400 tracking-widest uppercase dark:font-tech text-center animate-gradient bg-[length:200%_auto]">
        {message}
      </p>
      {/* Dots animation */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-cyan-400 animate-bounce"></div>
        <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-cyan-400 animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 rounded-full bg-pink-500 dark:bg-cyan-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  </div>
);
