import React, { useRef, useEffect, useState } from 'react';
import { FilterState } from '../types';
import { Translation } from '../translations';

interface CanvasEditorProps {
  imageSrc: string | null;
  filters: FilterState;
  onImageProcessed: (base64: string, isCropResult?: boolean) => void;
  t: Translation;
  isCropping?: boolean;
  cropParams?: { zoom: number; aspect: number | null };
  cropTrigger?: number;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ 
  imageSrc, 
  filters, 
  onImageProcessed, 
  t,
  isCropping = false,
  cropParams = { zoom: 1, aspect: null },
  cropTrigger = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  
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
    const ctx = canvas.getContext('2d');
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

      // Calculate dimensions respecting rotation (90/270 flips dimensions)
      const isVertical = filters.rotate % 180 !== 0;
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      // Determine canvas size based on rotation state
      const targetWidth = isVertical ? originalHeight : originalWidth;
      const targetHeight = isVertical ? originalWidth : originalHeight;

      // High DPI support
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      setCanvasDimensions({ width: targetWidth, height: targetHeight });

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Apply CSS Filters
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

      // 2. Transform context for Rotation and Flip
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((filters.rotate * Math.PI) / 180);
      if (filters.flipH) {
        ctx.scale(-1, 1);
      }

      // 3. Draw image centered
      ctx.drawImage(
        img, 
        -originalWidth / 2, 
        -originalHeight / 2, 
        originalWidth, 
        originalHeight
      );

      ctx.restore();
      
      // Reset Filter for overlays
      ctx.filter = 'none';

      // 4. Apply Vignette (Software Render)
      if (filters.vignette > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; // Better blend mode for vignette
        
        const radius = Math.max(canvas.width, canvas.height) * 0.8;
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, 
          canvas.height / 2, 
          0, 
          canvas.width / 2, 
          canvas.height / 2, 
          radius
        );

        // Transparent center to black edges
        // Control the "tightness" based on strength
        const intensity = filters.vignette / 100;
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.5 - (intensity * 0.1), 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // 5. If Cropping Mode, Draw Overlay
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
        
        // Dark Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        
        const topH = rect.y;
        const bottomH = originalHeight - (rect.y + rect.h);
        const leftW = rect.x;
        const rightW = originalWidth - (rect.x + rect.w);
        
        ctx.fillRect(-originalWidth/2, -originalHeight/2, originalWidth, topH);
        ctx.fillRect(-originalWidth/2, (rect.y + rect.h) - originalHeight/2, originalWidth, bottomH);
        ctx.fillRect(-originalWidth/2, drawY, leftW, rect.h);
        ctx.fillRect((rect.x + rect.w) - originalWidth/2, drawY, rightW, rect.h);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, rect.w, rect.h);
        
        // Grid (Rule of Thirds)
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
      {/* Canvas Wrapper for Shadow/Border */}
      <div className="relative shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_0_40px_-5px_rgba(6,182,212,0.2)] transition-shadow duration-500">
        {/* Checkerboard pattern for transparency */}
        <div className="absolute inset-0 z-0 rounded-sm bg-[url('https://media.istockphoto.com/id/1133426908/vector/checkered-transparent-background-pattern-vector-art.jpg?s=612x612&w=0&k=20&c=IqY_r5259-b4u876mF61K1fV6x3W6s_w1Tz2K4a6Q1I=')] bg-repeat bg-[length:20px_20px] opacity-50 dark:opacity-10"></div>
        
        <canvas
          ref={canvasRef}
          className="relative z-10 max-w-[85vw] max-h-[70vh] object-contain rounded-sm dark:border dark:border-white/10"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
      </div>
    </div>
  );
};