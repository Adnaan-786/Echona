"use client";

import { useEffect, useState, useRef } from "react";

export function LoadingIntro() {
  const [showIntro, setShowIntro] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Only show the intro if they haven't seen it in this session
    const hasSeenIntro = sessionStorage.getItem("echona_intro_played");
    if (!hasSeenIntro) {
      setShowIntro(true);
      // Give React time to mount the video, then ensure it plays
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            // If autoplay fails (e.g. browser policy without mute), skip intro gracefully
            console.warn("Autoplay blocked:", err);
            finishIntro();
          });
        }
      }, 100);
    }
  }, []);

  const finishIntro = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem("echona_intro_played", "true");
    }, 1500); // Wait for the fade out to complete
  };

  if (!showIntro) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1714] transition-opacity duration-[1500ms] ease-in-out transform-gpu will-change-opacity ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src="/echona_ink_intro.mp4"
        className="w-full h-full object-cover absolute inset-0"
        muted
        playsInline
        autoPlay
        onEnded={finishIntro}
      />
      
      {/* Skip button for returning users who cleared session storage or just don't want to wait */}
      <button
        onClick={finishIntro}
        className={`absolute bottom-8 right-8 z-[101] text-xs font-cinzel tracking-widest text-white/50 hover:text-white/90 transition-all duration-700 ease-in-out ${
          isFadingOut ? "opacity-0" : "opacity-100"
        }`}
      >
        SKIP INTRO
      </button>
    </div>
  );
}
