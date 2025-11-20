
import { FilterState, DEFAULT_FILTERS } from './types';

export interface Preset {
  id: string;
  nameKey: string; // Key for translation
  filterValues: Partial<FilterState>;
}

export const PRESETS: Preset[] = [
  {
    id: 'normal',
    nameKey: 'presetNormal',
    filterValues: DEFAULT_FILTERS
  },
  {
    id: 'vivid',
    nameKey: 'presetVivid',
    filterValues: {
      ...DEFAULT_FILTERS,
      contrast: 120,
      saturation: 130,
      brightness: 105
    }
  },
  {
    id: 'warm',
    nameKey: 'presetWarm',
    filterValues: {
      ...DEFAULT_FILTERS,
      temperature: 40,
      sepia: 10,
      brightness: 105,
      saturation: 110
    }
  },
  {
    id: 'cool',
    nameKey: 'presetCool',
    filterValues: {
      ...DEFAULT_FILTERS,
      temperature: -40,
      hue: -5,
      contrast: 110
    }
  },
  {
    id: 'vintage',
    nameKey: 'presetVintage',
    filterValues: {
      ...DEFAULT_FILTERS,
      sepia: 40,
      contrast: 90,
      brightness: 110,
      noise: 30,
      vignette: 40
    }
  },
  {
    id: 'bw',
    nameKey: 'presetBW',
    filterValues: {
      ...DEFAULT_FILTERS,
      grayscale: 100,
      contrast: 120,
      brightness: 110
    }
  },
  {
    id: 'cyber',
    nameKey: 'presetCyber',
    filterValues: {
      ...DEFAULT_FILTERS,
      saturation: 150,
      contrast: 130,
      temperature: -20,
      hue: 15,
      vignette: 50,
      noise: 15
    }
  },
  {
    id: 'soft',
    nameKey: 'presetSoft',
    filterValues: {
      ...DEFAULT_FILTERS,
      contrast: 90,
      brightness: 115,
      saturation: 85,
      blur: 0.5,
      temperature: 10
    }
  },
  {
    id: 'drama',
    nameKey: 'presetDrama',
    filterValues: {
      ...DEFAULT_FILTERS,
      contrast: 140,
      saturation: 90,
      vignette: 60,
      brightness: 90
    }
  }
];

// Helper to generate CSS string for thumbnails (Approximation)
export const getCssStringFromFilter = (filters: Partial<FilterState>) => {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return `
    brightness(${f.brightness}%) 
    contrast(${f.contrast}%) 
    grayscale(${f.grayscale}%) 
    saturate(${f.saturation}%) 
    hue-rotate(${f.hue}deg) 
    sepia(${f.sepia}%) 
    invert(${f.invert}%)
  `;
};
