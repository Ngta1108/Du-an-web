
import React from 'react';
import { PRESETS, getCssStringFromFilter } from '../presets';
import { FilterState } from '../types';
import { Translation } from '../translations';
import { Palette } from 'lucide-react';

interface FilterGalleryProps {
  imageSrc: string | null;
  currentFilters: FilterState;
  onApplyPreset: (filters: Partial<FilterState>) => void;
  t: Translation;
}

export const FilterGallery: React.FC<FilterGalleryProps> = ({ imageSrc, currentFilters, onApplyPreset, t }) => {
  if (!imageSrc) return null;

  return (
    <div className="flex items-center h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 border-r border-gray-200 dark:border-white/10 mr-2 h-10 shrink-0">
        <Palette size={16} className="text-gray-400 dark:text-cyan-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 dark:font-tech hidden sm:inline">
          {t.filters}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto custom-scrollbar snap-x items-center h-full py-1 pr-4">
        {PRESETS.map((preset) => {
          return (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset.filterValues)}
              className="group flex flex-col items-center gap-1 min-w-[60px] snap-start focus:outline-none"
            >
              <div className={`
                relative w-12 h-12 rounded-lg dark:rounded-sm overflow-hidden transition-all duration-300
                border-2 
                group-hover:scale-110 group-active:scale-95
                group-hover:border-pink-400 dark:group-hover:border-cyan-400
                dark:group-hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]
                bg-gray-100 dark:bg-white/5
                border-transparent
              `}>
                <img 
                  src={imageSrc} 
                  alt={preset.id}
                  className="w-full h-full object-cover"
                  style={{ filter: getCssStringFromFilter(preset.filterValues) }}
                />
                
                {preset.filterValues.temperature && preset.filterValues.temperature !== 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none mix-blend-overlay"
                    style={{ 
                      backgroundColor: preset.filterValues.temperature > 0 
                        ? `rgba(255, 160, 0, ${preset.filterValues.temperature / 400})` 
                        : `rgba(0, 100, 255, ${Math.abs(preset.filterValues.temperature) / 400})`
                    }}
                  />
                )}
              </div>
              
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 group-hover:text-pink-500 dark:group-hover:text-cyan-400 uppercase dark:font-tech truncate w-full text-center">
                {/* @ts-ignore - dynamic key access */}
                {t[preset.nameKey] || preset.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
