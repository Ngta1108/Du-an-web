/**
 * Anime Filter Service - Enhanced Version
 * Transforms images into anime-style artwork with improved algorithms
 */

/**
 * Apply anime filter to image
 * @param imageBase64 - Base64 image string
 * @param intensity - Filter intensity (0-100)
 * @returns Anime-styled image as base64
 */
export const applyAnimeFilter = async (
  imageBase64: string,
  intensity: number = 80
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const normalizedIntensity = intensity / 100;

        // Step 1: Apply bilateral filter for STRONG smoothing (anime skin effect)
        imageData = bilateralFilterEnhanced(imageData, normalizedIntensity);
        
        // Step 2: Vibrant color enhancement
        enhanceColors(imageData, normalizedIntensity);
        
        // Step 3: Edge detection and outline
        const edges = detectEdgesEnhanced(imageData);
        
        // Step 4: Apply cell shading with smart quantization
        quantizeColors(imageData, Math.floor(6 + normalizedIntensity * 4)); // 6-10 levels
        
        // Step 5: Composite edges as outlines
        compositeEdges(imageData, edges, normalizedIntensity);
        
        // Step 6: Final brightness boost
        brightenImage(imageData, 1.05 + normalizedIntensity * 0.1);

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageBase64;
  });
};

/**
 * Apply cartoon filter (softer, lighter anime style)
 */
export const applyCartoonFilter = async (imageBase64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Lighter smoothing
        imageData = bilateralFilterEnhanced(imageData, 0.5);
        
        // Moderate color boost
        enhanceColors(imageData, 0.6);
        
        // Less aggressive quantization
        quantizeColors(imageData, 8); // More levels = softer
        
        // Subtle edges
        const edges = detectEdgesEnhanced(imageData);
        compositeEdges(imageData, edges, 0.4);
        
        // Slight brightness
        brightenImage(imageData, 1.08);

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageBase64;
  });
};

/**
 * Apply manga filter (high contrast black & white)
 */
export const applyMangaFilter = async (imageBase64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to grayscale with high contrast
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // High contrast threshold
          const value = gray > 128 ? 255 : 0;
          
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }

        // Detect and enhance edges
        const edges = detectEdges(imageData);
        for (let i = 0; i < data.length; i += 4) {
          if (edges.data[i] > 30) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageBase64;
  });
};

// Helper functions

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Enhanced bilateral filter for aggressive smoothing
function bilateralFilterEnhanced(imageData: ImageData, intensity: number): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);
  const outputData = output.data;

  const kernelSize = 7; // Larger kernel for stronger smoothing
  const halfKernel = 3;
  const spatialSigma = 3;
  const colorSigma = 30 + intensity * 50; // More aggressive

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0;
      const centerIdx = (y * width + x) * 4;

      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const ny = Math.min(Math.max(y + ky, 0), height - 1);
          const nx = Math.min(Math.max(x + kx, 0), width - 1);
          const idx = (ny * width + nx) * 4;

          // Spatial weight
          const spatialDist = kx * kx + ky * ky;
          const spatialWeight = Math.exp(-spatialDist / (2 * spatialSigma * spatialSigma));

          // Color difference weight
          const colorDiff = Math.sqrt(
            Math.pow(data[idx] - data[centerIdx], 2) +
            Math.pow(data[idx + 1] - data[centerIdx + 1], 2) +
            Math.pow(data[idx + 2] - data[centerIdx + 2], 2)
          );
          const colorWeight = Math.exp(-colorDiff / (2 * colorSigma));

          const weight = spatialWeight * colorWeight;

          sumR += data[idx] * weight;
          sumG += data[idx + 1] * weight;
          sumB += data[idx + 2] * weight;
          sumWeight += weight;
        }
      }

      outputData[centerIdx] = sumR / sumWeight;
      outputData[centerIdx + 1] = sumG / sumWeight;
      outputData[centerIdx + 2] = sumB / sumWeight;
      outputData[centerIdx + 3] = data[centerIdx + 3];
    }
  }

  return output;
}

// Vibrant color enhancement
function enhanceColors(imageData: ImageData, intensity: number): void {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convert to HSL
    const hsl = rgbToHsl(r, g, b);
    
    // Boost saturation significantly
    hsl.s = Math.min(1, hsl.s * (1.3 + intensity * 0.4));
    
    // Slightly brighten
    hsl.l = Math.min(0.95, hsl.l * (1 + intensity * 0.08));

    // Convert back to RGB
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
  }
}

// Smart color quantization (cell shading)
function quantizeColors(imageData: ImageData, levels: number): void {
  const data = imageData.data;
  const step = 256 / levels;

  for (let i = 0; i < data.length; i += 4) {
    // Quantize each channel
    data[i] = Math.floor(data[i] / step) * step + step / 2;
    data[i + 1] = Math.floor(data[i + 1] / step) * step + step / 2;
    data[i + 2] = Math.floor(data[i + 2] / step) * step + step / 2;
  }
}

// Composite edges as black outlines
function compositeEdges(imageData: ImageData, edges: ImageData, intensity: number): void {
  const data = imageData.data;
  const edgeData = edges.data;
  const threshold = 30 - intensity * 10; // Lower threshold = more edges

  for (let i = 0; i < data.length; i += 4) {
    if (edgeData[i] > threshold) {
      const edgeFactor = Math.min(1, edgeData[i] / 100);
      // Darken with edge strength
      data[i] *= (1 - edgeFactor * 0.7);
      data[i + 1] *= (1 - edgeFactor * 0.7);
      data[i + 2] *= (1 - edgeFactor * 0.7);
    }
  }
}

// Brighten image
function brightenImage(imageData: ImageData, factor: number): void {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * factor);
    data[i + 1] = Math.min(255, data[i + 1] * factor);
    data[i + 2] = Math.min(255, data[i + 2] * factor);
  }
}

// Enhanced edge detection with better sensitivity
function detectEdgesEnhanced(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);
  const outputData = output.data;

  // Sobel operator
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          
          gx += gray * sobelX[ky + 1][kx + 1];
          gy += gray * sobelY[ky + 1][kx + 1];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const outIdx = (y * width + x) * 4;
      
      // Normalize and boost edge strength
      const boosted = Math.min(255, magnitude * 1.5);
      
      outputData[outIdx] = boosted;
      outputData[outIdx + 1] = boosted;
      outputData[outIdx + 2] = boosted;
      outputData[outIdx + 3] = 255;
    }
  }

  return output;
}


