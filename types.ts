export interface FilterState {
  brightness: number; // 0-200, default 100
  contrast: number;   // 0-200, default 100
  grayscale: number;  // 0-100, default 0
  blur: number;       // 0-20, default 0
  rotate: number;     // 0, 90, 180, 270
  flipH: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  blur: 0,
  rotate: 0,
  flipH: false,
};

export interface AnalysisResult {
  description: string;
  suggestions: string[];
}