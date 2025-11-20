
export interface FilterState {
  brightness: number; // 0-200, default 100
  contrast: number;   // 0-200, default 100
  saturation: number; // 0-200, default 100
  hue: number;        // 0-360, default 0
  grayscale: number;  // 0-100, default 0
  sepia: number;      // 0-100, default 0
  invert: number;     // 0-100, default 0
  blur: number;       // 0-20, default 0
  vignette: number;   // 0-100, default 0 (software render)
  rotate: number;     // 0, 90, 180, 270
  flipH: boolean;
  
  // Pro Features
  temperature: number; // -100 to 100 (Cool to Warm)
  noise: number;       // 0-100
  pixelate: number;    // 0-50 (Block size)
  threshold: number;   // 0-255, 0 means disabled. 1-255 is the cutoff.
}

export const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  blur: 0,
  vignette: 0,
  rotate: 0,
  flipH: false,
  
  temperature: 0,
  noise: 0,
  pixelate: 0,
  threshold: 0,
};

export interface AnalysisResult {
  description: string;
  suggestions: string[];
  filterAdjustments?: Partial<FilterState>;
}

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
}
