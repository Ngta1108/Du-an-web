import React, { useState } from 'react';
import { Sparkles, Bot, Loader2, Wand2, RotateCcw, CheckCircle2, Sliders } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { AnalysisResult, FilterState } from '../types';
import { Translation, Language } from '../translations';

interface AIPanelProps {
  currentImageBase64: string | null;
  t: Translation;
  language: Language;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const AIPanel: React.FC<AIPanelProps> = ({ currentImageBase64, t, language, setFilters }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleAnalyze = async () => {
    if (!currentImageBase64) return;
    
    setLoading(true);
    setApplied(false);
    try {
      const result = await analyzeImage(currentImageBase64, language);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyAiSettings = () => {
    if (analysis?.filterAdjustments) {
      setFilters(prev => ({
        ...prev,
        ...analysis.filterAdjustments
      }));
      setApplied(true);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Magic Header */}
      <div className="p-6 pb-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg dark:rounded-sm bg-gradient-to-br from-indigo-500 to-fuchsia-500 dark:from-cyan-600 dark:to-blue-600 text-white shadow-lg shadow-indigo-500/20 dark:shadow-cyan-500/20">
            <Sparkles size={16} />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white text-base dark:font-tech dark:tracking-widest dark:uppercase">
            {t.aiAssistant}
          </h3>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 ml-11 tracking-wide font-medium dark:font-tech">
          {t.poweredBy}
        </p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        {!currentImageBase64 ? (
           <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
             <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full dark:rounded-none flex items-center justify-center mb-6 border dark:border-white/10">
                <Bot size={32} className="text-gray-400 dark:text-cyan-500/50" />
             </div>
             <p className="text-base font-medium text-gray-500 dark:text-gray-500 dark:font-tech max-w-[200px] leading-relaxed">
               {t.uploadToEnable}
             </p>
           </div>
        ) : (
          <>
            {!analysis && !loading && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className={`
                  p-6 rounded-2xl dark:rounded-sm border transition-all
                  bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-cyan-900/10 dark:to-transparent 
                  border-indigo-100 dark:border-cyan-500/20
                `}>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-center dark:font-tech dark:text-sm">
                    {t.aiPrompt}
                  </p>
                  <button
                    onClick={handleAnalyze}
                    className={`
                      w-full py-3.5 px-5 rounded-xl dark:rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2.5 group
                      bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 dark:from-cyan-600 dark:to-blue-700
                      hover:from-indigo-500 hover:to-fuchsia-500 dark:hover:from-cyan-500 dark:hover:to-blue-600
                      text-white
                      shadow-lg shadow-indigo-500/30 dark:shadow-[0_0_15px_rgba(8,145,178,0.4)]
                      hover:-translate-y-0.5
                      dark:font-tech dark:uppercase dark:tracking-wider
                    `}
                  >
                    <Wand2 size={18} className="group-hover:rotate-12 transition-transform" /> 
                    {t.analyzeButton}
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-fade-in">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/20 dark:bg-cyan-500/20 animate-ping absolute inset-0"></div>
                  <div className="w-20 h-20 rounded-full dark:rounded-sm bg-white dark:bg-black flex items-center justify-center relative shadow-xl border border-indigo-100 dark:border-cyan-500/50">
                    <div className="absolute inset-0 rounded-full dark:rounded-sm border-t-2 border-indigo-500 dark:border-cyan-400 animate-spin"></div>
                    <Sparkles size={30} className="text-indigo-600 dark:text-cyan-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-cyan-500 tracking-wide uppercase animate-pulse dark:font-tech">
                  {t.analyzing}
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6 animate-slide-up">
                
                {/* Auto Enhance Action Card */}
                {analysis.filterAdjustments && (
                  <div className="p-4 bg-indigo-50 dark:bg-cyan-950/20 border border-indigo-100 dark:border-cyan-500/30 rounded-xl dark:rounded-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-indigo-900 dark:text-cyan-400 dark:font-tech uppercase flex items-center gap-2">
                        <Sliders size={14} />
                        Auto-Enhance
                      </h4>
                      <span className="text-[10px] font-bold bg-white dark:bg-black/50 px-2 py-0.5 rounded text-gray-400 dark:font-tech">AI CALIBRATED</span>
                    </div>
                    
                    {applied ? (
                       <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-bold dark:font-tech py-2">
                         <CheckCircle2 size={18} />
                         {t.aiApplied}
                       </div>
                    ) : (
                      <button
                        onClick={applyAiSettings}
                        className={`
                          w-full py-3 rounded-lg dark:rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2
                          bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-600 dark:hover:bg-cyan-500
                          text-white shadow-md
                          dark:font-tech dark:uppercase
                        `}
                      >
                        <Sparkles size={16} />
                        {t.applyAi}
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1">{t.description}</h4>
                  <div className="bg-white dark:bg-[#0F0F0F] p-5 rounded-xl dark:rounded-sm border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed dark:font-tech">
                      {analysis.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 dark:font-tech ml-1 flex items-center gap-2">
                    {t.suggestedEdits}
                  </h4>
                  <div className="grid gap-3">
                    {analysis.suggestions.map((suggestion, idx) => (
                      <div key={idx} className={`
                        flex items-start gap-3 text-sm p-3 transition-all cursor-default hover:translate-x-1
                        bg-white dark:bg-[#0F0F0F]
                        text-gray-700 dark:text-gray-300 
                        rounded-xl dark:rounded-sm
                        border-l-4 border-y border-r border-gray-100 dark:border-white/10
                        border-l-indigo-500 dark:border-l-cyan-500
                        shadow-sm hover:shadow-md dark:shadow-none
                      `}>
                        <span className="mt-0.5 leading-relaxed dark:font-tech font-medium">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleAnalyze}
                  className="w-full py-3.5 text-xs font-bold text-gray-500 hover:text-indigo-600 dark:text-gray-600 dark:hover:text-cyan-400 bg-gray-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg dark:rounded-sm transition-colors flex items-center justify-center gap-2.5 mt-4 dark:font-tech dark:uppercase"
                >
                  <RotateCcw size={14} />
                  {t.reAnalyze}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};