"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function VideoScrollSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  
  const totalFrames = 240;
  
  const targetFrame = useRef(0);
  const currentFrame = useRef(0);
  const lastDrawnFrame = useRef(-1);
  
  const drawFrame = useCallback((index: number, imgArray: HTMLImageElement[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const idx = Math.max(0, Math.min(Math.floor(index), totalFrames - 1));
    
    if (imgArray[idx]?.complete) {
      ctx.drawImage(imgArray[idx], 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#1a1714";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let count = 0;
    
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNumber = i.toString().padStart(4, '0');
      img.src = `/assets/video-frames/frame_${frameNumber}.jpg`;
      
      img.onload = () => {
        count++;
        if (i === 1 && currentFrame.current === 0) {
          drawFrame(0, loadedImages);
        } else if (count === 1 && currentFrame.current === 0) {
          drawFrame(i - 1, loadedImages);
        }
      };
      loadedImages.push(img);
    }
    
    setImages(loadedImages);
  }, [drawFrame]);

  useEffect(() => {
    if (images.length === 0) return;

    let rafId: number;

    const handleScroll = () => {
      // The scrollable area for the video is the first 400vh
      const scrollPixels = window.scrollY;
      const maxScrollPixels = window.innerHeight * 4;
      
      let progress = 0;
      if (scrollPixels > 0 && maxScrollPixels > 0) {
        progress = Math.min(1, scrollPixels / maxScrollPixels);
      } else if (scrollPixels < 0) {
        progress = 0;
      }
      
      targetFrame.current = progress * (totalFrames - 1);
    };

    const renderLoop = () => {
      currentFrame.current += (targetFrame.current - currentFrame.current) * 0.1;
      
      const currentIdx = Math.max(0, Math.min(Math.floor(currentFrame.current), totalFrames - 1));
      
      if (currentIdx !== lastDrawnFrame.current) {
        drawFrame(currentFrame.current, images);
        lastDrawnFrame.current = currentIdx;
      }
      
      const heroOverlay = document.getElementById('hero-title-overlay');
      if (heroOverlay) {
        const newOpacity = Math.max(0, 1 - (currentFrame.current / 30)).toString();
        if (heroOverlay.style.opacity !== newOpacity) {
          heroOverlay.style.opacity = newOpacity;
        }
      }
      
      rafId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    
    handleScroll();
    rafId = requestAnimationFrame(renderLoop);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [images, drawFrame]);

  return (
    <>
      {/* FIXED BACKGROUND CANVAS */}
      <div className="fixed inset-0 w-full h-full -z-50 bg-[#1a1714]">
        <canvas 
          ref={canvasRef} 
          width={3840} 
          height={2160}
          className="absolute inset-0 w-full h-full opacity-100"
          style={{ 
            objectFit: 'cover',
            backgroundImage: "url('/assets/video-frames/frame_0001.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        {/* Subtle vignette/fade over the map to make text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1714]/40 via-transparent to-[#1a1714]/80 pointer-events-none" />
      </div>

      {/* HERO TITLE OVERLAY - Fades out dynamically via JS in renderLoop */}
      <div id="hero-title-overlay" className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-40 transition-opacity duration-100">
        <h1 className="font-cinzel font-bold text-6xl md:text-8xl lg:text-[10rem] text-transparent bg-clip-text bg-gradient-to-b from-[#f4ede0] to-[#d4af37] tracking-[0.15em] drop-shadow-[0_0_30px_rgba(212,175,55,0.4)] text-center">
          ECHONA <span className="text-[#c62828]">2K26</span>
        </h1>
        <p className="mt-4 font-garamond italic text-2xl md:text-4xl text-[#d6c7b0] tracking-[0.2em] drop-shadow-lg text-center max-w-3xl px-4">
          The Brethren Court of Competitive Programming
        </p>
      </div>

      {/* INVISIBLE SCROLL TRACK (400vh) */}
      <div style={{ height: '400vh' }} className="w-full relative pointer-events-none">
        {/* Scroll Indicator at the very bottom of the initial viewport */}
        <div className="absolute top-[85vh] left-1/2 -translate-x-1/2 flex flex-col items-center opacity-70 animate-bounce pointer-events-none">
          <span className="text-[10px] tracking-[0.3em] font-cinzel text-[#d6c7b0] mb-2 uppercase drop-shadow-md">Scroll to Explore</span>
          <svg className="w-5 h-5 text-[#d6c7b0] drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </>
  );
}
