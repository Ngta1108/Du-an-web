import React, { useRef, useEffect, useState } from 'react';
import { FilterState } from '../types';

interface CanvasEditorProps {
  imageSrc: string | null;
  filters: FilterState;
  onImageProcessed: (base64: string) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ imageSrc, filters, onImageProcessed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

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
      
      // Update state for CSS display scaling
      setCanvasDimensions({ width: targetWidth, height: targetHeight });

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply filters using Context Filter API
      // Order matters slightly, but standard CSS filter string works well
      const filterString = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        grayscale(${filters.grayscale}%)
        blur(${filters.blur}px)
      `;
      ctx.filter = filterString;

      // Transform context for Rotation and Flip
      ctx.save();

      // Move to center to rotate
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // Rotate
      ctx.rotate((filters.rotate * Math.PI) / 180);
      
      // Flip
      if (filters.flipH) {
        ctx.scale(-1, 1);
      }

      // Draw image centered. 
      // Note: We draw based on original image dims, offset by half.
      ctx.drawImage(
        img, 
        -originalWidth / 2, 
        -originalHeight / 2, 
        originalWidth, 
        originalHeight
      );

      ctx.restore();
      
      // Emit the processed image for AI or Download
      // Debounce slightly in a real app, but here direct is fine for this scale
      // Using a low quality jpg for the AI preview to save bandwidth, png for download
      const dataUrl = canvas.toDataURL('image/png');
      onImageProcessed(dataUrl);
    };

  }, [imageSrc, filters, onImageProcessed]);

  if (!imageSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-lg bg-gray-900/50">
        <div className="text-center">
          <p>No image selected</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-gray-900 rounded-lg shadow-inner relative"
    >
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain shadow-2xl"
        style={{
          // Ensure the canvas doesn't overflow the container visually
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
    </div>
  );
};