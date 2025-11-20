
import React, { useRef, useEffect, useState } from 'react';
import { FilterState, HistogramData } from '../types';
import { Translation } from '../translations';

interface CanvasEditorProps {
  imageSrc: string | null;
  filters: FilterState;
  onImageProcessed: (base64: string, isCropResult?: boolean) => void;
  t: Translation;
  isCropping?: boolean;
  cropParams?: { zoom: number; aspect: number | null };
  cropTrigger?: number;
  onHistogramData?: (data: HistogramData) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ 
  imageSrc, 
  filters, 
  onImageProcessed, 
  t,
  isCropping = false,
  cropParams = { zoom: 1, aspect: null },
  cropTrigger = 0,
  onHistogramData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track previous trigger to only run on change
  const prevTriggerRef = useRef(cropTrigger);

  // Function to calculate the centered crop rectangle
  const getCropRect = (width: number, height: number, zoom: number, aspect: number | null) => {
    let cropW = width / zoom;
    let cropH = height / zoom;

    if (aspect) {
      const currentAspect = cropW / cropH;
      if (currentAspect > aspect) {
        cropW = cropH * aspect;
      } else {
        cropH = cropW / aspect;
      }
    }

    const cropX = (width - cropW) / 2;
    const cropY = (height - cropH) / 2;
    
    return { x: cropX, y: cropY, w: cropW, h: cropH };
  };

  // Initialize and draw image
  useEffect(() => {
    if (!imageSrc || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimization
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    
    img.onload = () => {
      // Perform Actual Crop if triggered
      if (cropTrigger > prevTriggerRef.current) {
        prevTriggerRef.current = cropTrigger;
        
        // Calculate crop coords on original image
        const rect = getCropRect(img.naturalWidth, img.naturalHeight, cropParams.zoom, cropParams.aspect);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = rect.w;
        tempCanvas.height = rect.h;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.drawImage(
            img, 
            rect.x, rect.y, rect.w, rect.h, // Source
            0, 0, rect.w, rect.h            // Dest
          );
          const croppedBase64 = tempCanvas.toDataURL('image/png');
          onImageProcessed(croppedBase64, true); // true = isCropResult
          return; // Stop here
        }
      }

      // --- Standard Rendering ---

      const isVertical = filters.rotate % 180 !== 0;
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      const targetWidth = isVertical ? originalHeight : originalWidth;
      const targetHeight = isVertical ? originalWidth : originalHeight;

      // High DPI support
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Basic CSS Filters
      const filterString = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        grayscale(${filters.grayscale}%)
        blur(${filters.blur}px)
        saturate(${filters.saturation}%)
        hue-rotate(${filters.hue}deg)
        sepia(${filters.sepia}%)
        invert(${filters.invert}%)
      `;
      ctx.filter = filterString;

      // 2. Geometry Transform
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((filters.rotate * Math.PI) / 180);
      if (filters.flipH) {
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        img, 
        -originalWidth / 2, 
        -originalHeight / 2, 
        originalWidth, 
        originalHeight
      );

      ctx.restore();
      ctx.filter = 'none';

      // 3. Advanced "Pro" Filters (Software Rendering)
      // We need ImageData for Noise, Threshold, Pixelate
      const hasSoftwareFilters = filters.noise > 0 || filters.pixelate > 0 || filters.threshold > 0;
      const needsHistogram = !!onHistogramData;

      if (hasSoftwareFilters || needsHistogram) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const len = data.length;

        // Histogram Buckets
        const rCounts = new Array(256).fill(0);
        const gCounts = new Array(256).fill(0);
        const bCounts = new Array(256).fill(0);

        // --- PIXEL PROCESSING LOOP ---
        for (let i = 0; i < len; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          // a = data[i + 3];

          // A. PIXELATE
          if (filters.pixelate > 0) {
            const pixelIdx = i / 4;
            const x = pixelIdx % canvas.width;
            const y = Math.floor(pixelIdx / canvas.width);
            const size = Math.max(2, filters.pixelate);
            
            const blkX = Math.floor(x / size) * size;
            const blkY = Math.floor(y / size) * size;
            
            // If not the top-left pixel of the block, we don't compute, we just wait for the block fill?
            // Actually, simpler logic for single pass:
            // Map current x,y to the reference pixel
            const refIdx = (blkY * canvas.width + blkX) * 4;
            if (refIdx < len) {
              r = data[refIdx];
              g = data[refIdx + 1];
              b = data[refIdx + 2];
              // Write back immediately so noise/threshold uses pixelated value
              data[i] = r;
              data[i+1] = g;
              data[i+2] = b;
            }
          }

          // B. NOISE
          if (filters.noise > 0) {
            const noise = (Math.random() - 0.5) * (filters.noise * 1.5);
            r = Math.min(255, Math.max(0, r + noise));
            g = Math.min(255, Math.max(0, g + noise));
            b = Math.min(255, Math.max(0, b + noise));
          }

          // C. THRESHOLD
          if (filters.threshold > 0) {
            // Convert to grayscale first
            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const val = gray >= filters.threshold ? 255 : 0;
            r = val;
            g = val;
            b = val;
          }

          // Update Data
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;

          // Histogram Data Collection
          if (needsHistogram) {
             rCounts[r]++;
             gCounts[g]++;
             bCounts[b]++;
          }
        }

        // Apply changes
        ctx.putImageData(imageData, 0, 0);

        // Emit Histogram
        if (onHistogramData) {
          onHistogramData({ r: rCounts, g: gCounts, b: bCounts });
        }
      }

      // 4. Temperature / Tint Overlay (Using Blending Mode)
      if (filters.temperature !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = filters.temperature > 0 ? 'overlay' : 'color-burn'; 
        // Simple logic: Warm = Orange Overlay, Cool = Blue Overlay
        if (filters.temperature > 0) {
           ctx.fillStyle = `rgba(255, 160, 0, ${filters.temperature / 200})`; // Warm Orange
        } else {
           ctx.fillStyle = `rgba(0, 100, 255, ${Math.abs(filters.temperature) / 200})`; // Cool Blue
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // 5. Vignette (Software Render)
      if (filters.vignette > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; 
        
        const radius = Math.max(canvas.width, canvas.height) * 0.8;
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, 
          canvas.height / 2, 
          0, 
          canvas.width / 2, 
          canvas.height / 2, 
          radius
        );
        const intensity = filters.vignette / 100;
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.5 - (intensity * 0.1), 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // 6. Crop Overlay (if cropping)
      if (isCropping) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((filters.rotate * Math.PI) / 180);
        if (filters.flipH) {
           ctx.scale(-1, 1);
        }
        
        const rect = getCropRect(originalWidth, originalHeight, cropParams.zoom, cropParams.aspect);
        const drawX = rect.x - originalWidth / 2;
        const drawY = rect.y - originalHeight / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const topH = rect.y;
        const bottomH = originalHeight - (rect.y + rect.h);
        const leftW = rect.x;
        const rightW = originalWidth - (rect.x + rect.w);
        
        ctx.fillRect(-originalWidth/2, -originalHeight/2, originalWidth, topH);
        ctx.fillRect(-originalWidth/2, (rect.y + rect.h) - originalHeight/2, originalWidth, bottomH);
        ctx.fillRect(-originalWidth/2, drawY, leftW, rect.h);
        ctx.fillRect((rect.x + rect.w) - originalWidth/2, drawY, rightW, rect.h);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, rect.w, rect.h);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drawX + rect.w/3, drawY);
        ctx.lineTo(drawX + rect.w/3, drawY + rect.h);
        ctx.moveTo(drawX + 2*rect.w/3, drawY);
        ctx.lineTo(drawX + 2*rect.w/3, drawY + rect.h);
        ctx.moveTo(drawX, drawY + rect.h/3);
        ctx.lineTo(drawX + rect.w, drawY + rect.h/3);
        ctx.moveTo(drawX, drawY + 2*rect.h/3);
        ctx.lineTo(drawX + rect.w, drawY + 2*rect.h/3);
        ctx.stroke();

        ctx.restore();
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      onImageProcessed(dataUrl, false);
    };

  }, [imageSrc, filters, isCropping, cropParams, cropTrigger, onImageProcessed]);

  if (!imageSrc) return null;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
    >
      <div className="relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_0_40px_-5px_rgba(6,182,212,0.2)] transition-shadow duration-500">
        <div className="absolute inset-0 z-0 rounded-sm bg-[url('https://media.istockphoto.com/id/1133426908/vector/checkered-transparent-background-pattern-vector-art.jpg?s=612x612&w=0&k=20&c=IqY_r5259-b4u876mF61K1fV6x3W6s_w1Tz2K4a6Q1I=')] bg-repeat bg-[length:20px_20px] opacity-50 dark:opacity-10"></div>
        <canvas
          ref={canvasRef}
          className="relative z-10 max-w-[85vw] max-h-[70vh] object-contain rounded-sm dark:border dark:border-white/10"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
    </div>
  );
};
