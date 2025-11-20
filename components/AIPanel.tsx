
import React, { useState } from 'react';
import { Sparkles, Bot, Loader2, Wand2, RotateCcw, CheckCircle2, Sliders, FileText, Copy, Image as ImageIcon, ChevronLeft, Brain, MessageSquareHeart, Plus, ScanEye, Share2, Palette as PaletteIcon, Hash, Sticker } from 'lucide-react';
import { analyzeImage, generateImagePrompt, detectObjects, generateSocialCaption, extractColorPalette, createStickerFromImage } from '../services/geminiService';
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
}

type AgentType = 'enhancer' | 'promptGen' | 'scanner' | 'social' | 'palette' | 'stickerMaker' | null;

export const AIPanel: React.FC<AIPanelProps> = ({ currentImageBase64, t, language, setFilters, onAddToHistory, setDetectedObjects, onAddSticker }) => {
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
        <div className="mb-5 flex items-center gap-2 text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/10 pb-2">
          <Bot size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest dark:font-tech">AI Magic Hub</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id as AgentType)}
              className="flex flex-col items-center gap-2 group relative"
            >
              <div className={`
                w-14 h-14 flex items-center justify-center text-white shadow-lg
                bg-gradient-to-br ${agent.color} dark:${agent.darkColor}
                rounded-[20px] dark:rounded-lg
                transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                group-hover:scale-110 group-hover:-translate-y-2 group-active:scale-95
                border border-white/20 dark:border-white/10 
                group-hover:shadow-xl z-10 relative
              `}>
                {/* Glossy reflection */}
                <div className="absolute inset-0 rounded-[20px] dark:rounded-lg bg-gradient-to-tr from-white/0 via-white/0 to-white/30 pointer-events-none"></div>
                
                {React.cloneElement(agent.icon as React.ReactElement<any>, { 
                  className: "drop-shadow-md transition-transform group-hover:scale-110 group-hover:rotate-6" 
                })}
              </div>
              
              {/* Reflection Shadow */}
              <div className={`
                 absolute -bottom-2 w-10 h-2 rounded-[100%] blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300
                 bg-gradient-to-r ${agent.color} dark:${agent.darkColor}
              `}></div>

              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 dark:font-tech group-hover:text-pink-500 dark:group-hover:text-cyan-400 transition-colors text-center leading-tight w-full px-1 z-20">
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
          className="p-2 rounded-xl dark:rounded-md bg-white dark:bg-white/5 hover:bg-pink-50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-all hover:text-pink-500 dark:hover:text-white hover:-translate-x-0.5 border border-gray-100 dark:border-white/5 shadow-sm"
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
                <Bot size={40} className="text-gray-300 dark:text-cyan-500/50" />
             </div>
             <p className="text-sm font-bold text-gray-400 dark:text-gray-500 dark:font-tech max-w-[200px] leading-relaxed uppercase tracking-wider">
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
                    gradient="from-fuchsia-500 to-pink-500 dark:from-cyan-600 dark:to-blue-600"
                  />
                )}
                {loadingEnhance && <LoadingState message={t.analyzing} />}
                {analysis && (
                  <div className="space-y-5 animate-slide-up pb-10">
                    {analysis.filterAdjustments && (
                      <div className="p-4 bg-gradient-to-br from-pink-50 to-white dark:from-cyan-950/30 dark:to-transparent border border-pink-100 dark:border-cyan-500/30 rounded-2xl dark:rounded-md shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-pink-600 dark:text-cyan-400 dark:font-tech uppercase flex items-center gap-2"><Sliders size={14} /> Auto-Enhance</h4>
                        </div>
                        {applied ? (
                           <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold dark:font-tech py-3 bg-green-50 dark:bg-green-900/20 rounded-xl dark:rounded-none border border-green-100 dark:border-green-500/20"><CheckCircle2 size={16} />{t.aiApplied}</div>
                        ) : (
                          <button onClick={applyAiSettings} className="w-full py-3 rounded-xl dark:rounded-sm font-bold text-xs transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 dark:from-cyan-600 dark:to-blue-600 text-white dark:font-tech dark:uppercase hover:-translate-y-0.5 shadow-lg shadow-pink-500/20 dark:shadow-cyan-500/20"><Sparkles size={14} />{t.applyAi}</button>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">{t.description}</h4>
                      <div className="bg-white dark:bg-[#0F0F0F] p-4 rounded-2xl dark:rounded-md border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none"><p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed dark:font-tech">{analysis.description}</p></div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">{t.suggestedEdits}</h4>
                      <div className="grid gap-2">
                        {analysis.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm p-3.5 bg-white dark:bg-[#0F0F0F] text-gray-600 dark:text-gray-300 rounded-2xl dark:rounded-md border border-gray-100 dark:border-white/10 hover:border-pink-200 dark:hover:border-cyan-900/50 transition-colors">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-400 dark:bg-cyan-500 shrink-0"></div><span className="dark:font-tech font-medium text-xs">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleAnalyze} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-pink-500 dark:text-gray-600 dark:hover:text-cyan-400 bg-transparent hover:bg-pink-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
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

const WelcomeCard = ({ desc, btnText, onClick, icon: Icon, gradient }: any) => (
    <div className={`
        p-8 rounded-[24px] dark:rounded-lg border transition-all text-center
        bg-gradient-to-b from-white/80 to-white/20 dark:from-white/5 dark:to-transparent 
        border-gray-100 dark:border-white/10 shadow-lg dark:shadow-none backdrop-blur-md
    `}>
        <div className={`
             w-16 h-16 mx-auto mb-6 rounded-2xl dark:rounded-md flex items-center justify-center text-white shadow-lg
             bg-gradient-to-br ${gradient}
        `}>
             <Icon size={32} />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-8 leading-relaxed dark:font-tech">{desc}</p>
        <button onClick={onClick} className={`
            w-full py-4 px-4 rounded-2xl dark:rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 group
            bg-gradient-to-r ${gradient} text-white
            shadow-xl hover:-translate-y-1 active:scale-95 hover:shadow-2xl
            dark:font-tech dark:uppercase dark:tracking-wider
        `}>
            {btnText} <Icon size={18} className="group-hover:rotate-12 transition-transform" />
        </button>
    </div>
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-fade-in">
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 dark:from-cyan-500/20 dark:to-blue-500/20 animate-ping absolute inset-0"></div>
      <div className="w-20 h-20 rounded-full dark:rounded-md bg-white dark:bg-black flex items-center justify-center relative shadow-2xl border border-pink-100 dark:border-cyan-500/50">
        <div className="absolute inset-0 rounded-full dark:rounded-md border-t-2 border-pink-500 dark:border-cyan-400 animate-spin"></div>
        <Sparkles size={32} className="text-pink-500 dark:text-cyan-400 animate-pulse" />
      </div>
    </div>
    <p className="text-xs font-bold text-pink-400 dark:text-cyan-400 tracking-widest uppercase animate-pulse dark:font-tech text-center">
      {message}
    </p>
  </div>
);
