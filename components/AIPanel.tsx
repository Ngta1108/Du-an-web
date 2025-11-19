import React, { useState } from 'react';
import { Sparkles, Bot, Loader2 } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { AnalysisResult } from '../types';

interface AIPanelProps {
  currentImageBase64: string | null;
}

export const AIPanel: React.FC<AIPanelProps> = ({ currentImageBase64 }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!currentImageBase64) return;
    
    setLoading(true);
    try {
      const result = await analyzeImage(currentImageBase64);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentImageBase64) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-900 rounded-lg border border-gray-800">
        <Bot size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Upload an image to enable AI analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
        <div className="flex items-center gap-2 text-indigo-400 mb-1">
          <Sparkles size={18} />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <p className="text-xs text-gray-400">Powered by Gemini 2.5</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {!analysis && !loading && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400 mb-4">
              Ask the AI Agent to analyze your photo and suggest the best edits.
            </p>
            <button
              onClick={handleAnalyze}
              className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Analyze Image
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
            <p className="text-sm text-gray-400">Analyzing composition & lighting...</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gray-800/50 p-3 rounded-md border border-gray-700">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Description</h4>
              <p className="text-sm text-gray-200 leading-relaxed">{analysis.description}</p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Suggested Edits</h4>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300 bg-gray-800/30 p-2 rounded">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={handleAnalyze}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline mt-2 w-full text-center"
            >
              Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
};