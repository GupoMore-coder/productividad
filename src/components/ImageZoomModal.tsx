import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageGalleryModalProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageZoomModal({ photos, initialIndex, onClose }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  if (!photos || photos.length === 0) return null;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[20000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-10 cursor-zoom-out"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center gap-6 cursor-default"
      >
        {/* Navigation Controls Overlay */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none z-20">
          {photos.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="p-4 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all pointer-events-auto backdrop-blur-md active:scale-90"
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={handleNext}
                className="p-4 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all pointer-events-auto backdrop-blur-md active:scale-90"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </div>

        {/* Top bar info */}
        <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-30 pointer-events-none">
          <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl">
            <ZoomIn size={16} className="text-purple-400" />
            <span className="text-sm font-black text-white tracking-widest uppercase">
              {currentIndex + 1} / {photos.length}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all pointer-events-auto backdrop-blur-xl group active:scale-95 shadow-2xl"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
        
        {/* Main Image Container */}
        <div className="relative w-full h-[75vh] flex items-center justify-center rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentIndex}
              src={photos[currentIndex]} 
              alt={`Imagen ${currentIndex + 1}`}
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.1, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="max-w-full max-h-full object-contain rounded-2xl select-none"
            />
          </AnimatePresence>
        </div>
        
        {/* Footer info */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full backdrop-blur-md">
            <span className="text-[0.65rem] font-black text-purple-400 uppercase tracking-[0.3em]">
              Alta Resolución • Modo Galería
            </span>
          </div>
          <div className="h-1.5 flex gap-1.5 mt-2">
            {photos.map((_, idx) => (
              <div 
                key={idx}
                className={`h-full transition-all duration-300 rounded-full ${idx === currentIndex ? 'w-8 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
