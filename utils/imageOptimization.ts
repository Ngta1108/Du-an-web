/**
 * Image Optimization Utilities
 * Caching and performance optimization for image operations
 */

// Cache for processed images
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load and cache image
 * @param src Image source URL or base64
 * @returns Cached or newly loaded image
 */
export const loadImageCached = (src: string): Promise<HTMLImageElement> => {
  // Check cache first
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Cache the loaded image
      imageCache.set(src, img);
      resolve(img);
    };
    
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Clear image cache (call when needed to free memory)
 */
export const clearImageCache = () => {
  imageCache.clear();
};

/**
 * Resize image for faster processing (if too large)
 * @param img Source image
 * @param maxDimension Maximum width or height
 * @returns Resized canvas or original image
 */
export const optimizeImageSize = (
  img: HTMLImageElement, 
  maxDimension: number = 2048
): HTMLCanvasElement | HTMLImageElement => {
  const { width, height } = img;
  
  // If image is small enough, return as-is
  if (width <= maxDimension && height <= maxDimension) {
    return img;
  }
  
  // Calculate new dimensions
  const scale = Math.min(maxDimension / width, maxDimension / height);
  const newWidth = Math.floor(width * scale);
  const newHeight = Math.floor(height * scale);
  
  // Create optimized canvas
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  const ctx = canvas.getContext('2d', { 
    alpha: true,
    willReadFrequently: false // Performance hint
  });
  
  if (!ctx) return img;
  
  // Use high-quality downscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  
  return canvas;
};

/**
 * Throttle function execution
 * @param func Function to throttle
 * @param delay Delay in milliseconds
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      // Schedule for later
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - timeSinceLastCall);
    }
  };
};

/**
 * Create offscreen canvas for better performance
 * @param width Canvas width
 * @param height Canvas height
 */
export const createOffscreenCanvas = (
  width: number, 
  height: number
): OffscreenCanvas | HTMLCanvasElement => {
  // Use OffscreenCanvas if available (better performance)
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  
  // Fallback to regular canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/**
 * Batch canvas operations for better performance
 * @param canvas Target canvas
 * @param operations Array of canvas operations
 */
export const batchCanvasOperations = (
  canvas: HTMLCanvasElement,
  operations: Array<(ctx: CanvasRenderingContext2D) => void>
) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return;
  
  // Save state once
  ctx.save();
  
  // Execute all operations
  operations.forEach(op => op(ctx));
  
  // Restore state once
  ctx.restore();
};

