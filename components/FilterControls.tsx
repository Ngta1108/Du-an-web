import React from 'react';
import { FilterState } from '../types';
import { Sun, Contrast, EyeOff, RotateCw, FlipHorizontal, RefreshCcw, Droplets } from 'lucide-react';

interface FilterControlsProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({ filters, setFilters, onReset }) => {
  
  const updateFilter = (key: keyof FilterState, value: number | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRotate = () => {
    setFilters(prev => ({ ...prev, rotate: (prev.rotate + 90) % 360 }));
  };

  return (
    <div className="space-y-6 p-4 bg-gray-900 rounded-lg border border-gray-800 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Adjustments</h3>
        <button 
          onClick={onReset}
          className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
        >
          <RefreshCcw size={14} /> Reset
        </button>
      </div>

      {/* Brightness */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span className="flex items-center gap-2"><Sun size={16} /> Brightness</span>
          <span>{filters.brightness}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          value={filters.brightness}
          onChange={(e) => updateFilter('brightness', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Contrast */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span className="flex items-center gap-2"><Contrast size={16} /> Contrast</span>
          <span>{filters.contrast}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          value={filters.contrast}
          onChange={(e) => updateFilter('contrast', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Blur */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span className="flex items-center gap-2"><Droplets size={16} /> Blur</span>
          <span>{filters.blur}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          value={filters.blur}
          onChange={(e) => updateFilter('blur', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Grayscale */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span className="flex items-center gap-2"><EyeOff size={16} /> Grayscale</span>
          <span>{filters.grayscale}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={filters.grayscale}
          onChange={(e) => updateFilter('grayscale', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      <hr className="border-gray-800 my-4" />

      <h3 className="text-lg font-semibold text-white mb-4">Transform</h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleRotate}
          className="flex flex-col items-center justify-center p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
        >
          <RotateCw size={20} className="mb-1 text-blue-400" />
          <span className="text-xs text-gray-300">Rotate</span>
        </button>

        <button
          onClick={() => updateFilter('flipH', !filters.flipH)}
          className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors border ${filters.flipH ? 'bg-blue-900/30 border-blue-500/50' : 'bg-gray-800 hover:bg-gray-700 border-gray-700'}`}
        >
          <FlipHorizontal size={20} className={`mb-1 ${filters.flipH ? 'text-blue-400' : 'text-gray-400'}`} />
          <span className="text-xs text-gray-300">Flip X</span>
        </button>
      </div>
    </div>
  );
};