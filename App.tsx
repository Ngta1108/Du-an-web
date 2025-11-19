import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Zap } from 'lucide-react';
import { FilterControls } from './components/FilterControls';
import { CanvasEditor } from './components/CanvasEditor';
import { AIPanel } from './components/AIPanel';
import { FilterState, DEFAULT_FILTERS } from './types';

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setImageSrc(e.target.result);
          setFilters(DEFAULT_FILTERS); // Reset filters on new image
          setProcessedImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.download = `smartlens-edit-${Date.now()}.png`;
      link.href = processedImage;
      link.click();
    }
  };

  // Callback from CanvasEditor when rendering is done
  const handleImageProcessed = useCallback((base64: string) => {
    setProcessedImage(base64);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 bg-gray-950 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            SmartLens AI
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={triggerUpload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-medium rounded-md transition-colors border border-gray-700"
          >
            <Upload size={16} />
            <span>Upload</span>
          </button>
          
          <button 
            onClick={handleDownload}
            disabled={!imageSrc}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              imageSrc 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Controls */}
        <aside className="w-80 flex-shrink-0 border-r border-gray-800 bg-gray-950 p-4 flex flex-col gap-4 z-10">
          <FilterControls 
            filters={filters} 
            setFilters={setFilters} 
            onReset={() => setFilters(DEFAULT_FILTERS)} 
          />
        </aside>

        {/* Center - Canvas Area */}
        <section className="flex-1 bg-gray-900 relative p-8 overflow-hidden flex flex-col">
          <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-800 shadow-2xl bg-gray-950/50 backdrop-blur">
            {imageSrc ? (
              <CanvasEditor 
                imageSrc={imageSrc} 
                filters={filters} 
                onImageProcessed={handleImageProcessed}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                 <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <ImageIcon size={48} className="opacity-50" />
                 </div>
                 <h2 className="text-xl font-medium text-gray-300">No image loaded</h2>
                 <p className="text-sm max-w-xs text-center">Upload an image to start editing with AI-powered tools.</p>
                 <button 
                   onClick={triggerUpload}
                   className="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-sm transition-colors"
                 >
                   Select from computer
                 </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Sidebar - AI Agent */}
        <aside className="w-80 flex-shrink-0 border-l border-gray-800 bg-gray-950 p-4 z-10">
          <AIPanel currentImageBase64={processedImage} />
        </aside>

      </main>
    </div>
  );
};

export default App;