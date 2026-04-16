"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AutoDestructTrackerProps {
  onDestruct: () => void;
  colorTheme?: 'green' | 'blue' | 'orange' | 'red';
}

export default function AutoDestructTracker({ onDestruct, colorTheme = 'red' }: AutoDestructTrackerProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const handleActivity = () => {
      setTimeLeft(60); // Reset timer on ANY interaction
    };

    // Attach native DOM event listeners globally to track standard shoulder-surfing metrics
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Hard 1-second interval ticking
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Destruct Sequence Triggered!
          clearInterval(interval);
          onDestruct();
          alert('SECURITY OVERRIDE: INACTIVITY TIMEOUT. SESSION WIPED NATIVELY.');
          // Force back to dashboard natively if we are deeply embedded in a vault
          if (window.location.pathname !== '/') {
            router.push('/');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [onDestruct, router]);

  // Determine pulsating aesthetics based on proximity to destruction
  const isCritical = timeLeft <= 10;
  
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black/80 backdrop-blur-md border px-4 py-2 rounded-full transition-all duration-300 font-mono shadow-2xl ${isCritical ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse' : `border-${colorTheme}-900`}`}>
       <div className={`w-3 h-3 rounded-full ${isCritical ? 'bg-red-500 animate-ping' : `bg-${colorTheme}-500 opacity-50`}`}></div>
       <span className={`text-xs font-bold uppercase tracking-widest ${isCritical ? 'text-red-400' : 'text-gray-500'}`}>
         Auto-Destruct
       </span>
       <span className={`text-sm font-bold w-6 text-center ${isCritical ? 'text-red-400' : 'text-gray-400'}`}>
         {timeLeft}s
       </span>
    </div>
  );
}
