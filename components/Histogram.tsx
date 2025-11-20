
import React, { useEffect, useRef } from 'react';
import { HistogramData } from '../types';

interface HistogramProps {
  data: HistogramData | null;
}

export const Histogram: React.FC<HistogramProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Find max value to normalize
    const maxVal = Math.max(
      ...data.r,
      ...data.g,
      ...data.b
    );

    if (maxVal === 0) return;

    // Helper to draw a channel
    const drawChannel = (values: number[], color: string, fill: string) => {
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const normalizedHeight = (values[i] / maxVal) * height;
        const y = height - normalizedHeight;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Draw Composition mode (Additive)
    ctx.globalCompositeOperation = 'screen';

    // Red
    drawChannel(data.r, 'rgba(255, 50, 50, 0.8)', 'rgba(255, 0, 0, 0.2)');
    // Green
    drawChannel(data.g, 'rgba(50, 255, 50, 0.8)', 'rgba(0, 255, 0, 0.2)');
    // Blue
    drawChannel(data.b, 'rgba(50, 50, 255, 0.8)', 'rgba(0, 0, 255, 0.2)');

    // Reset
    ctx.globalCompositeOperation = 'source-over';

  }, [data]);

  if (!data) return null;

  return (
    <div className="w-full h-24 bg-gray-100 dark:bg-black border border-gray-200 dark:border-cyan-900/30 rounded-xl dark:rounded-sm overflow-hidden relative">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={100} 
        className="w-full h-full block opacity-80"
      />
      <div className="absolute top-1 left-2 text-[9px] font-bold text-gray-400 dark:text-gray-600 pointer-events-none">HISTOGRAM</div>
    </div>
  );
};
