
import React, { useState } from 'react';
import { Sparkles, Bot, Loader2, Wand2, RotateCcw, CheckCircle2, Sliders, FileText, Copy, Image as ImageIcon, ChevronLeft, BrainCircuit, MessageCircle, Plus, Scan, Share2, Palette as PaletteIcon, Hash } from 'lucide-react';
import { analyzeImage, generateImagePrompt, detectObjects, generateSocialCaption, extractColorPalette } from '../services/geminiService';
import { AnalysisResult, FilterState, DetectedObject, SocialContent } from '../types';
import { Translation, Language } from '../translations';

interface AIPanelProps {
  currentImageBase64: string | null;
  t: Translation;
  language: Language;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onAddToHistory: () => void;
  setDetectedObjects: (objs: DetectedObject[]) => void;
}

type AgentType = 'enhancer' | 'promptGen' | 'scanner' | 'social' | 'palette' | null;

export const AIPanel: React.FC<AIPanelProps> = ({ currentImageBase64, t, language, setFilters, onAddToHistory, setDetectedObjects }) => {
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
      icon: <Wand2 size={20} />, 
      label: t.agentEnhancer,
      // Cute: Pink/Violet | Dark: Cyber Cyan
      color: 'from-pink-400 to-violet-400 shadow-pink-200',
      darkColor: 'from-cyan-600 to-blue-600 shadow-none'
    },
    { 
      id: 'promptGen', 
      icon: <MessageCircle size={20} />, 
      label: t.agentPrompt, 
      // Cute: Orange/Rose | Dark: Cyber Amber
      color: 'from-orange-300 to-rose-300 shadow-orange-100',
      darkColor: 'from-amber-600 to-orange-700 shadow-none'
    },
    {
        id: 'scanner',
        icon: <Scan size={20} />,
        label: t.agentScanner,
        // Cute: Emerald/Teal | Dark: Cyber Green
        color: 'from-emerald-300 to-teal-300 shadow-emerald-100',
        darkColor: 'from-emerald-600 to-green-600 shadow-none'
    },
    {
        id: 'social',
        icon: <Share2 size={20} />,
        label: t.agentSocial,
        // Cute: Blue/Indigo | Dark: Cyber Indigo
        color: 'from-blue-300 to-indigo-300 shadow-blue-100',
        darkColor: 'from-indigo-600 to-purple-600 shadow-none'
    },
    {
        id: 'palette',
        icon: <PaletteIcon size={20} />,
        label: t.agentPalette,
        // Cute: Rainbow-ish | Dark: Colorful
        color: 'from-rose-300 to-yellow-200 shadow-rose-100',
        darkColor: 'from-purple-600 to-pink-600 shadow-none'
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
        <div className="mb-4 flex items-center gap-2 text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/10 pb-2">
          <BrainCircuit size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest dark:font-tech">AI Apps</span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setActiveAgent(agent.id as AgentType)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`
                w-14 h-14 flex items-center justify-center text-white shadow-lg
                bg-gradient-to-br ${agent.color} dark:${agent.darkColor}
                rounded-[18px] dark:rounded-md
                transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                group-hover:scale-110 group-hover:-translate-y-1 group-active:scale-95
                border-[2px] border-white dark:border-white/5 dark:group-hover:border-white/30
              `}>
                {React.cloneElement(agent.icon as React.ReactElement<any>, { 
                  className: "drop-shadow-sm transition-transform group-hover:rotate-12" 
                })}
              </div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 dark:font-tech group-hover:text-pink-500 dark:group-hover:text-cyan-400 transition-colors text-center leading-tight truncate w-full px-1">
                {agent.label}
              </span>
            </button>
          ))}
          
          {/* Placeholder for future apps */}
          <div className="flex flex-col items-center gap-2 group opacity-60 hover:opacity-100 transition-all cursor-default">
            <div className="w-14 h-14 flex items-center justify-center rounded-[18px] dark:rounded-md border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-gray-300 dark:text-gray-600 group-hover:border-pink-200 dark:group-hover:border-cyan-800 group-hover:text-pink-300 dark:group-hover:text-cyan-700 transition-colors">
              <Plus size={20} />
            </div>
            <span className="text-[9px] font-medium text-gray-300 dark:text-gray-600 dark:font-tech uppercase group-hover:text-pink-300 dark:group-hover:text-cyan-700">More</span>
          </div>
        </div>
      </div>
    );
  }

  // === VIEW: AGENT DETAIL ===
  return (
    <div className="h-full flex flex-col">
      {/* Navigation Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
        <button 
          onClick={() => {
              setActiveAgent(null);
              setDetectedObjects([]); // Reset detection overlay on exit
          }}
          className="p-2 rounded-full dark:rounded-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-gray-400 transition-all hover:text-gray-800 dark:hover:text-white hover:-translate-x-0.5"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
            <div className={`
                w-7 h-7 rounded-xl dark:rounded-sm flex items-center justify-center text-white text-[10px] shadow-sm
                bg-gradient-to-br ${getAgentColor(activeAgent)} dark:${getAgentDarkColor(activeAgent)}
            `}>
                {activeAgent && getAgentIcon(activeAgent) ? React.cloneElement(getAgentIcon(activeAgent) as any, { size: 14 }) : null}
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-white dark:font-tech uppercase tracking-wide">
              {getAgentLabel(activeAgent)}
            </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar">
        {!currentImageBase64 ? (
           <div className="h-full flex flex-col items-center justify-center text-center opacity-60 pb-20">
             <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] dark:rounded-none flex items-center justify-center mb-4 border border-gray-100 dark:border-white/10">
                <Bot size={32} className="text-gray-300 dark:text-cyan-500/50" />
             </div>
             <p className="text-sm font-medium text-gray-400 dark:text-gray-500 dark:font-tech max-w-[200px] leading-relaxed">
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
                    icon={Wand2} 
                    gradient="from-pink-500 via-purple-500 to-indigo-500 dark:from-cyan-600 dark:to-blue-700"
                  />
                )}
                {loadingEnhance && <LoadingState message={t.analyzing} />}
                {analysis && (
                  <div className="space-y-5 animate-slide-up pb-10">
                    {analysis.filterAdjustments && (
                      <div className="p-4 bg-pink-50/50 dark:bg-cyan-950/20 border border-pink-100 dark:border-cyan-500/30 rounded-2xl dark:rounded-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-pink-900 dark:text-cyan-400 dark:font-tech uppercase flex items-center gap-2"><Sliders size={14} /> Auto-Enhance</h4>
                        </div>
                        {applied ? (
                           <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold dark:font-tech py-2 bg-green-50 dark:bg-green-900/20 rounded-xl dark:rounded-none"><CheckCircle2 size={16} />{t.aiApplied}</div>
                        ) : (
                          <button onClick={applyAiSettings} className="w-full py-3 rounded-xl dark:rounded-sm font-bold text-xs transition-all flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white dark:font-tech dark:uppercase hover:-translate-y-0.5"><Sparkles size={14} />{t.applyAi}</button>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">{t.description}</h4>
                      <div className="bg-white dark:bg-[#0F0F0F] p-4 rounded-2xl dark:rounded-sm border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none"><p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed dark:font-tech">{analysis.description}</p></div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">{t.suggestedEdits}</h4>
                      <div className="grid gap-2">
                        {analysis.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm p-3.5 bg-white dark:bg-[#0F0F0F] text-gray-600 dark:text-gray-300 rounded-2xl dark:rounded-sm border border-gray-100 dark:border-white/10">
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-pink-400 dark:bg-cyan-500 shrink-0"></div><span className="dark:font-tech font-medium text-xs">{suggestion}</span>
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
                    <WelcomeCard desc={t.promptDesc} btnText={t.generatePromptBtn} onClick={handleGeneratePrompt} icon={MessageCircle} gradient="from-orange-400 to-rose-400 dark:from-amber-600 dark:to-orange-700" />
                 )}
                 {loadingPrompt && <LoadingState message={t.generating} />}
                 {generatedPrompt && (
                    <div className="animate-slide-up space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">{t.promptResult}</h4>
                        <button onClick={() => copyToClipboard(generatedPrompt)} className="text-xs flex items-center gap-1 text-pink-500 dark:text-cyan-400 hover:underline dark:font-tech font-bold">{copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}{copied ? t.copied : t.copyToClipboard}</button>
                      </div>
                      <div className="relative group">
                        <textarea readOnly value={generatedPrompt} className="w-full h-48 p-4 text-sm leading-relaxed rounded-2xl dark:rounded-sm bg-orange-50/30 dark:bg-[#0F0F0F] border border-orange-100 dark:border-white/10 focus:outline-none text-gray-700 dark:text-gray-300 resize-none dark:font-tech custom-scrollbar" />
                      </div>
                      <button onClick={handleGeneratePrompt} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-orange-500 dark:text-gray-600 dark:hover:text-cyan-400 bg-transparent hover:bg-orange-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                    </div>
                 )}
               </div>
            )}

            {/* === AGENT: SCANNER === */}
            {activeAgent === 'scanner' && (
                <div className="animate-fade-in space-y-6">
                    {!objectsFound && !isScanning && (
                        <WelcomeCard desc={t.scanDesc} btnText={t.startScan} onClick={handleScan} icon={Scan} gradient="from-emerald-400 to-teal-400 dark:from-emerald-600 dark:to-green-700" />
                    )}
                    {isScanning && <LoadingState message={t.scanning} />}
                    {objectsFound !== null && (
                        <div className="animate-slide-up space-y-4">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/30 rounded-2xl dark:rounded-sm text-center">
                                <Scan size={32} className="mx-auto mb-2 text-emerald-500 dark:text-emerald-400" />
                                <h4 className="text-lg font-bold text-emerald-700 dark:text-emerald-300 dark:font-tech">{objectsFound} {t.scanResult}</h4>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 opacity-80">{objectsFound > 0 ? "Check canvas for bounding boxes" : t.noObjects}</p>
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
                        <WelcomeCard desc={t.socialDesc} btnText={t.generateSocial} onClick={handleSocial} icon={Share2} gradient="from-blue-400 to-indigo-400 dark:from-indigo-600 dark:to-purple-700" />
                    )}
                    {loadingSocial && <LoadingState message={t.writing} />}
                    {socialContent && (
                        <div className="animate-slide-up space-y-6">
                             <div className="space-y-3">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">Captions</h4>
                                {socialContent.captions.map((cap, i) => (
                                    <div key={i} className="group relative p-4 bg-white dark:bg-[#0F0F0F] border border-gray-100 dark:border-white/10 rounded-2xl dark:rounded-sm hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => copyToClipboard(cap)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/20 text-gray-400 dark:text-gray-500"><Copy size={14}/></button>
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase mb-1 block dark:font-tech">{i === 0 ? t.captionFun : (i === 1 ? t.captionDeep : t.captionMinimal)}</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 dark:font-tech leading-relaxed pr-6">{cap}</p>
                                    </div>
                                ))}
                             </div>
                             <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1 flex items-center gap-1"><Hash size={12}/> Hashtags</h4>
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl dark:rounded-sm border border-indigo-100 dark:border-indigo-500/20 text-sm text-indigo-700 dark:text-indigo-300 font-medium leading-loose">
                                    {socialContent.hashtags.map(h => <span key={h} className="mr-2 inline-block hover:underline cursor-pointer" onClick={() => copyToClipboard(h)}>{h}</span>)}
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
                        <WelcomeCard desc={t.paletteDesc} btnText={t.extractColors} onClick={handlePalette} icon={PaletteIcon} gradient="from-rose-300 to-yellow-300 dark:from-purple-600 dark:to-pink-600" />
                    )}
                    {loadingPalette && <LoadingState message={t.extracting} />}
                    {colors.length > 0 && (
                        <div className="animate-slide-up space-y-6">
                            <div className="grid grid-cols-1 gap-3">
                                {colors.map((hex, i) => (
                                    <button key={i} onClick={() => copyColor(hex)} className="group flex items-center gap-4 p-3 bg-white dark:bg-[#0F0F0F] rounded-2xl dark:rounded-sm border border-gray-100 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30 transition-all">
                                        <div className="w-12 h-12 rounded-xl dark:rounded-sm shadow-sm" style={{ backgroundColor: hex }}></div>
                                        <div className="flex-1 text-left">
                                            <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">{hex}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase dark:font-tech">{copiedColor === hex ? t.hexCopied : "Click to copy"}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={handlePalette} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-rose-500 dark:text-gray-600 dark:hover:text-pink-400 bg-transparent hover:bg-rose-50 dark:hover:bg-white/10 rounded-xl dark:rounded-sm transition-colors flex items-center justify-center gap-2 dark:font-tech dark:uppercase"><RotateCcw size={14} />{t.reAnalyze}</button>
                        </div>
                    )}
                </div>
            )}
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-6 pb-4 pt-2">
        <p className="text-[10px] text-gray-300 dark:text-gray-700 tracking-wide font-medium dark:font-tech text-center uppercase">
          {t.poweredBy}
        </p>
      </div>
    </div>
  );
};

const WelcomeCard = ({ desc, btnText, onClick, icon: Icon, gradient }: any) => (
    <div className={`
        p-6 rounded-3xl dark:rounded-sm border transition-all text-center
        bg-gradient-to-b from-white/50 to-white dark:from-white/5 dark:to-transparent 
        border-gray-100 dark:border-white/10
    `}>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed dark:font-tech dark:text-sm">{desc}</p>
        <button onClick={onClick} className={`
            w-full py-3.5 px-4 rounded-2xl dark:rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2 group
            bg-gradient-to-r ${gradient} text-white
            shadow-lg hover:-translate-y-1 active:scale-95
            dark:font-tech dark:uppercase dark:tracking-wider
        `}>
            <Icon size={18} className="group-hover:scale-110 transition-transform" /> {btnText}
        </button>
    </div>
);

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-fade-in">
    <div className="relative">
      <div className="w-16 h-16 rounded-full bg-pink-500/20 dark:bg-cyan-500/20 animate-ping absolute inset-0"></div>
      <div className="w-16 h-16 rounded-full dark:rounded-sm bg-white dark:bg-black flex items-center justify-center relative shadow-xl border border-pink-100 dark:border-cyan-500/50">
        <div className="absolute inset-0 rounded-full dark:rounded-sm border-t-2 border-pink-400 dark:border-cyan-400 animate-spin"></div>
        <Sparkles size={24} className="text-pink-400 dark:text-cyan-400 animate-pulse" />
      </div>
    </div>
    <p className="text-xs font-bold text-gray-400 dark:text-cyan-500 tracking-wide uppercase animate-pulse dark:font-tech text-center">
      {message}
    </p>
  </div>
);
