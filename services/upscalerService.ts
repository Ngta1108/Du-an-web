import Upscaler from 'upscaler';
import model from '@upscalerjs/default-model';

let upscalerInstance: Upscaler | null = null;

/**
 * Initialize Upscaler instance (lazy load)
 */
const getUpscaler = async (): Promise<Upscaler> => {
  if (!upscalerInstance) {
    upscalerInstance = new Upscaler({
      model,
    });
  }
  return upscalerInstance;
};

/**
 * Upscale image using AI Super Resolution
 * @param imageBase64 - Base64 image string
 * @param scale - Upscale factor (2x, 3x, 4x)
 * @returns Upscaled image as base64
 */
export const upscaleImage = async (
  imageBase64: string,
  scale: 2 | 3 | 4 = 2
): Promise<string> => {
  try {
    const upscaler = await getUpscaler();
    
    // Create image element from base64
    const img = new Image();
    img.src = imageBase64;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Upscale the image
    const upscaledImage = await upscaler.upscale(img, {
      output: 'base64',
      patchSize: 64,
      padding: 2,
    });

    // If we need more than 2x, upscale multiple times
    if (scale === 3) {
      const img2 = new Image();
      img2.src = upscaledImage as string;
      await new Promise((resolve) => { img2.onload = resolve; });
      
      const finalUpscaled = await upscaler.upscale(img2, {
        output: 'base64',
        patchSize: 64,
        padding: 2,
      });
      return finalUpscaled as string;
    }
    
    if (scale === 4) {
      // 2x then 2x again = 4x
      const img2 = new Image();
      img2.src = upscaledImage as string;
      await new Promise((resolve) => { img2.onload = resolve; });
      
      const secondUpscale = await upscaler.upscale(img2, {
        output: 'base64',
        patchSize: 64,
        padding: 2,
      });
      
      return secondUpscale as string;
    }

    return upscaledImage as string;
  } catch (error) {
    console.error('Upscaling error:', error);
    throw new Error('Failed to upscale image. Please try again.');
  }
};

/**
 * Enhance image quality with sharpening
 * @param imageBase64 - Base64 image string
 * @returns Enhanced image as base64
 */
export const enhanceQuality = async (imageBase64: string): Promise<string> => {
  try {
    // Create canvas to apply sharpening
    const img = new Image();
    img.src = imageBase64;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context not available');

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sharpen kernel
    const sharpenKernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    const tempData = new Uint8ClampedArray(data);
    const width = canvas.width;

    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB only
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIndex = (ky + 1) * 3 + (kx + 1);
              sum += tempData[pixelIndex] * sharpenKernel[kernelIndex];
            }
          }
          const index = (y * width + x) * 4 + c;
          data[index] = Math.min(255, Math.max(0, sum));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Quality enhancement error:', error);
    throw new Error('Failed to enhance image quality.');
  }
};

/**
 * Get estimated processing time based on image size
 * @param width - Image width
 * @param height - Image height
 * @param scale - Upscale factor
 * @returns Estimated time in seconds
 */
export const estimateUpscaleTime = (
  width: number,
  height: number,
  scale: number
): number => {
  const pixels = width * height;
  const outputPixels = pixels * scale * scale;
  
  // Rough estimation: ~1 second per megapixel
  const megapixels = outputPixels / 1000000;
  return Math.ceil(megapixels * 2);
};

