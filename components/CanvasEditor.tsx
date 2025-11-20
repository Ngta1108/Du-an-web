
import React, { useRef, useEffect, useState } from 'react';
import { FilterState, HistogramData, TextLayer, StickerLayer, FrameType, DrawingPath, BrushSettings, DetectedObject } from '../types';
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
  viewZoom?: number;
  
  // Text Props
  textLayers?: TextLayer[];
  activeTextId?: string | null;
  onSelectText?: (id: string | null) => void;
  onUpdateTextPosition?: (id: string, x: number, y: number) => void;

  // Creative Props
  stickers?: StickerLayer[];
  activeStickerId?: string | null;
  onSelectSticker?: (id: string | null) => void;
  activeFrame?: FrameType;
  onUpdateStickerPosition?: (id: string, x: number, y: number) => void;
  
  // Brush Props
  drawingPaths?: DrawingPath[];
  brushSettings?: BrushSettings;
  onAddDrawingPath?: (path: DrawingPath) => void;
  
  // Compare Mode
  isComparing?: boolean;

  // AI Props
  detectedObjects?: DetectedObject[];
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ 
  imageSrc, 
  filters, 
  onImageProcessed, 
  t,
  isCropping = false,
  cropParams = { zoom: 1, aspect: null },
  cropTrigger = 0,
  onHistogramData,
  viewZoom = 1,
  textLayers = [],
  activeTextId = null,
  onSelectText,
  onUpdateTextPosition,
  stickers = [],
  activeStickerId = null,
  onSelectSticker,
  activeFrame = 'none',
  onUpdateStickerPosition,
  drawingPaths = [],
  brushSettings,
  onAddDrawingPath,
  isComparing = false,
  detectedObjects = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Dragging State (Shared for Text and Stickers)
  const [dragTarget, setDragTarget] = useState<{ type: 'text' | 'sticker', id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0, scaleX: 1, scaleY: 1 });

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  // Track previous trigger to only run on change
  const prevTriggerRef = useRef(cropTrigger);

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

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    
    img.onload = () => {
      // --- Crop Execution ---
      if (cropTrigger > prevTriggerRef.current) {
        prevTriggerRef.current = cropTrigger;
        const rect = getCropRect(img.naturalWidth, img.naturalHeight, cropParams.zoom, cropParams.aspect);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = rect.w;
        tempCanvas.height = rect.h;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
          const croppedBase64 = tempCanvas.toDataURL('image/png');
          onImageProcessed(croppedBase64, true);
          return;
        }
      }

      const isVertical = filters.rotate % 180 !== 0;
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;
      const targetWidth = isVertical ? originalHeight : originalWidth;
      const targetHeight = isVertical ? originalWidth : originalHeight;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const rect = canvas.getBoundingClientRect();
      setCanvasDimensions({
        width: targetWidth,
        height: targetHeight,
        scaleX: targetWidth / rect.width,
        scaleY: targetHeight / rect.height
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // If Comparing, skip filters and extra layers
      if (isComparing) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((filters.rotate * Math.PI) / 180);
        if (filters.flipH) ctx.scale(-1, 1);
        ctx.drawImage(img, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);
        ctx.restore();
        // Skip rest of the render loop
        return;
      }

      // 1. Filters
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

      // 2. Transform & Draw Image
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((filters.rotate * Math.PI) / 180);
      if (filters.flipH) ctx.scale(-1, 1);
      ctx.drawImage(img, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);
      ctx.restore();
      ctx.filter = 'none';

      // 3. Pro Filters (Software)
      const hasSoftwareFilters = filters.noise > 0 || filters.pixelate > 0 || filters.threshold > 0;
      const needsHistogram = !!onHistogramData;
      if (hasSoftwareFilters || needsHistogram) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const len = data.length;
        const rCounts = new Array(256).fill(0);
        const gCounts = new Array(256).fill(0);
        const bCounts = new Array(256).fill(0);

        for (let i = 0; i < len; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          if (filters.pixelate > 0) {
            const pixelIdx = i / 4;
            const x = pixelIdx % canvas.width;
            const y = Math.floor(pixelIdx / canvas.width);
            const size = Math.max(2, filters.pixelate);
            const blkX = Math.floor(x / size) * size;
            const blkY = Math.floor(y / size) * size;
            const refIdx = (blkY * canvas.width + blkX) * 4;
            if (refIdx < len) {
              r = data[refIdx]; g = data[refIdx + 1]; b = data[refIdx + 2];
              data[i] = r; data[i+1] = g; data[i+2] = b;
            }
          }
          if (filters.noise > 0) {
            const noise = (Math.random() - 0.5) * (filters.noise * 1.5);
            r = Math.min(255, Math.max(0, r + noise));
            g = Math.min(255, Math.max(0, g + noise));
            b = Math.min(255, Math.max(0, b + noise));
          }
          if (filters.threshold > 0) {
            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const val = gray >= filters.threshold ? 255 : 0;
            r = val; g = val; b = val;
          }

          data[i] = r; data[i+1] = g; data[i+2] = b;
          if (needsHistogram) { rCounts[r]++; gCounts[g]++; bCounts[b]++; }
        }
        ctx.putImageData(imageData, 0, 0);
        if (onHistogramData) onHistogramData({ r: rCounts, g: gCounts, b: bCounts });
      }

      // 4. Temperature & Vignette
      if (filters.temperature !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = filters.temperature > 0 ? 'overlay' : 'color-burn'; 
        ctx.fillStyle = filters.temperature > 0 ? `rgba(255, 160, 0, ${filters.temperature / 200})` : `rgba(0, 100, 255, ${Math.abs(filters.temperature) / 200})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      if (filters.vignette > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; 
        const radius = Math.max(canvas.width, canvas.height) * 0.8;
        const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${filters.vignette/100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      
      // 5. DRAWINGS
      drawingPaths.forEach(path => {
          if (path.points.length < 2) return;
          ctx.save();
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.size;
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          for(let i=1; i<path.points.length; i++){
              ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.stroke();
          ctx.restore();
      });
      
      if (isDrawing && currentPath.length > 1 && brushSettings) {
          ctx.save();
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeStyle = brushSettings.color;
          ctx.lineWidth = brushSettings.size;
          ctx.beginPath();
          ctx.moveTo(currentPath[0].x, currentPath[0].y);
          for(let i=1; i<currentPath.length; i++){
              ctx.lineTo(currentPath[i].x, currentPath[i].y);
          }
          ctx.stroke();
          ctx.restore();
      }

      // 6. DETECTED OBJECTS (Bounding Boxes)
      if (detectedObjects.length > 0) {
          ctx.save();
          detectedObjects.forEach(obj => {
              // box_2d is [ymin, xmin, ymax, xmax] normalized 0-1000
              const [ymin, xmin, ymax, xmax] = obj.box_2d;
              const x = (xmin / 1000) * canvas.width;
              const y = (ymin / 1000) * canvas.height;
              const w = ((xmax - xmin) / 1000) * canvas.width;
              const h = ((ymax - ymin) / 1000) * canvas.height;

              // Draw Box
              ctx.strokeStyle = '#00d9f9'; // Cyan
              ctx.lineWidth = 2;
              ctx.shadowColor = '#00d9f9';
              ctx.shadowBlur = 10;
              ctx.strokeRect(x, y, w, h);

              // Draw Label Background
              ctx.fillStyle = 'rgba(0, 217, 249, 0.2)';
              ctx.fillRect(x, y, w, h);

              // Draw Label Text
              const fontSize = Math.max(12, canvas.width / 50);
              ctx.font = `bold ${fontSize}px "Chakra Petch", sans-serif`;
              ctx.fillStyle = '#00d9f9';
              ctx.fillText(obj.label.toUpperCase(), x, y - 5);
          });
          ctx.restore();
      }

      // 7. STICKERS
      stickers.forEach(sticker => {
        ctx.save();
        ctx.font = `${sticker.size}px serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(sticker.content, sticker.x, sticker.y);
        
        if (activeStickerId === sticker.id) {
             ctx.strokeStyle = '#f472b6'; // Pink border for active sticker
             ctx.lineWidth = 2; 
             ctx.setLineDash([5, 5]);
             const boxSize = sticker.size * 1.2;
             ctx.strokeRect(sticker.x - boxSize/2, sticker.y - boxSize/2, boxSize, boxSize);
        }
        ctx.restore();
      });

      // 8. TEXT LAYERS
      textLayers.forEach(layer => {
        ctx.save();
        ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`;
        ctx.fillStyle = layer.color;
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(layer.text, layer.x, layer.y);
        
        if (activeTextId === layer.id) {
          const metrics = ctx.measureText(layer.text);
          ctx.strokeStyle = '#00d9f9'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
          ctx.strokeRect(layer.x - 5, layer.y - 5, metrics.width + 10, layer.fontSize * 1.2 + 10);
        }
        ctx.restore();
      });

      // 9. FRAMES (On Top)
      if (activeFrame && activeFrame !== 'none') {
        ctx.save();
        const w = canvas.width;
        const h = canvas.height;
        const borderWidth = Math.min(w, h) * 0.05;

        if (activeFrame === 'white') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = borderWidth;
          ctx.strokeRect(borderWidth/2, borderWidth/2, w - borderWidth, h - borderWidth);
        } else if (activeFrame === 'neon') {
          ctx.strokeStyle = '#00d9f9';
          ctx.lineWidth = borderWidth / 2;
          ctx.shadowColor = '#00d9f9';
          ctx.shadowBlur = 20;
          ctx.strokeRect(borderWidth, borderWidth, w - borderWidth*2, h - borderWidth*2);
        } else if (activeFrame === 'polaroid') {
          ctx.fillStyle = '#ffffff';
          // Bottom heavy
          const bottomBorder = h * 0.15;
          const sideBorder = w * 0.05;
          ctx.fillRect(0, 0, w, sideBorder); // Top
          ctx.fillRect(0, 0, sideBorder, h); // Left
          ctx.fillRect(w - sideBorder, 0, sideBorder, h); // Right
          ctx.fillRect(0, h - bottomBorder, w, bottomBorder); // Bottom
        } else if (activeFrame === 'film') {
           ctx.fillStyle = '#111';
           const sideH = h * 0.1;
           ctx.fillRect(0, 0, w, sideH); // Top strip
           ctx.fillRect(0, h - sideH, w, sideH); // Bottom strip
           // Sprockets
           ctx.fillStyle = '#fff';
           const holeW = w * 0.03;
           const holeH = sideH * 0.6;
           const gap = w * 0.05;
           for(let x = gap; x < w; x += gap + holeW) {
             ctx.fillRect(x, sideH/2 - holeH/2, holeW, holeH);
             ctx.fillRect(x, h - sideH/2 - holeH/2, holeW, holeH);
           }
        } else if (activeFrame === 'wood') {
           ctx.strokeStyle = '#8B4513';
           ctx.lineWidth = borderWidth;
           ctx.strokeRect(borderWidth/2, borderWidth/2, w - borderWidth, h - borderWidth);
           // Inner bevel
           ctx.strokeStyle = '#A0522D';
           ctx.lineWidth = borderWidth/4;
           ctx.strokeRect(borderWidth, borderWidth, w - borderWidth*2, h - borderWidth*2);
        }
        ctx.restore();
      }

      // 10. Crop Overlay
      if (isCropping) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((filters.rotate * Math.PI) / 180);
        if (filters.flipH) ctx.scale(-1, 1);
        const cropR = getCropRect(originalWidth, originalHeight, cropParams.zoom, cropParams.aspect);
        const drawX = cropR.x - originalWidth / 2;
        const drawY = cropR.y - originalHeight / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const topH = cropR.y;
        const bottomH = originalHeight - (cropR.y + cropR.h);
        const leftW = cropR.x;
        const rightW = originalWidth - (cropR.x + cropR.w);
        
        ctx.fillRect(-originalWidth/2, -originalHeight/2, originalWidth, topH);
        ctx.fillRect(-originalWidth/2, (cropR.y + cropR.h) - originalHeight/2, originalWidth, bottomH);
        ctx.fillRect(-originalWidth/2, drawY, leftW, cropR.h);
        ctx.fillRect((cropR.x + cropR.w) - originalWidth/2, drawY, rightW, cropR.h);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, cropR.w, cropR.h);
        ctx.restore();
      }
      
      onImageProcessed(canvas.toDataURL('image/png'), false);
    };

  }, [imageSrc, filters, isCropping, cropParams, cropTrigger, onImageProcessed, textLayers, activeTextId, stickers, activeStickerId, activeFrame, drawingPaths, isDrawing, currentPath, isComparing, detectedObjects]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = (canvasRef.current.width / rect.width);
    const scaleY = (canvasRef.current.height / rect.height);
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isComparing) return; // Disable interaction during compare

    const pos = getCanvasCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // BRUSH MODE
    if (brushSettings && brushSettings.isEnabled) {
        setIsDrawing(true);
        setCurrentPath([pos]);
        return;
    }

    // Check Text Layers
    if (onSelectText) {
      for (let i = textLayers.length - 1; i >= 0; i--) {
        const layer = textLayers[i];
        ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`;
        const metrics = ctx.measureText(layer.text);
        const width = metrics.width;
        const height = layer.fontSize * 1.2;
        
        if (pos.x >= layer.x && pos.x <= layer.x + width && pos.y >= layer.y && pos.y <= layer.y + height) {
          onSelectText(layer.id);
          if (onSelectSticker) onSelectSticker(null);
          setDragTarget({ type: 'text', id: layer.id });
          setDragOffset({ x: pos.x - layer.x, y: pos.y - layer.y });
          return;
        }
      }
    }
    
    // Check Stickers
    if (onUpdateStickerPosition && onSelectSticker) {
      for (let i = stickers.length - 1; i >= 0; i--) {
        const s = stickers[i];
        const halfSize = s.size / 2;
        if (pos.x >= s.x - halfSize && pos.x <= s.x + halfSize && pos.y >= s.y - halfSize && pos.y <= s.y + halfSize) {
           onSelectSticker(s.id);
           if (onSelectText) onSelectText(null); 
           setDragTarget({ type: 'sticker', id: s.id });
           setDragOffset({ x: pos.x - s.x, y: pos.y - s.y });
           return;
        }
      }
    }

    if (onSelectText) onSelectText(null);
    if (onSelectSticker) onSelectSticker(null);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isComparing) return;

    const pos = getCanvasCoordinates(e);
    
    if (isDrawing && brushSettings) {
        setCurrentPath(prev => [...prev, pos]);
        return;
    }

    if (!dragTarget) return;
    
    if (dragTarget.type === 'text' && onUpdateTextPosition) {
      onUpdateTextPosition(dragTarget.id, pos.x - dragOffset.x, pos.y - dragOffset.y);
    } else if (dragTarget.type === 'sticker' && onUpdateStickerPosition) {
      onUpdateStickerPosition(dragTarget.id, pos.x - dragOffset.x, pos.y - dragOffset.y);
    }
  };

  const handleMouseUp = () => {
      if (isComparing) return;

      if (isDrawing && brushSettings && currentPath.length > 1 && onAddDrawingPath) {
          onAddDrawingPath({
              points: currentPath,
              color: brushSettings.color,
              size: brushSettings.size,
              opacity: brushSettings.opacity
          });
      }
      setIsDrawing(false);
      setCurrentPath([]);
      setDragTarget(null);
  };

  if (!imageSrc) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        className="max-w-full max-h-full object-contain shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_0_30px_rgba(6,182,212,0.3)] rounded-sm dark:border dark:border-white/10 transition-transform duration-200 ease-out"
        style={{ 
          transform: `scale(${viewZoom})`,
          cursor: brushSettings?.isEnabled ? 'crosshair' : (dragTarget ? 'grabbing' : 'default')
        }}
      />
    </div>
  );
};
