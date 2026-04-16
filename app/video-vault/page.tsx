"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AutoDestructTracker from '../components/AutoDestructTracker';

export default function VideoVault() {
  const router = useRouter();
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  
  // Dashboard states
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [payloadProgress, setPayloadProgress] = useState(0);

  const handleDestruct = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setPasscode('');
    setShowResult(false);
    setPayloadProgress(0);
  };

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileDrop = (selectedFile: File) => {
    if (!selectedFile.type.match('video/mp4') && !selectedFile.name.endsWith('.avi')) {
      alert('Strict carrier limits: Video Vault requires .mp4 or .avi formats.');
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(selectedFile);
    setVideoUrl(url);
    setIsProcessing(false);
    setShowResult(false);
    setPayloadProgress(0);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files[0]);
    }
  };

  const onExecute = () => {
    if (!videoFile || !passcode) return;
    setIsProcessing(true);
    setPayloadProgress(0);

    // Simulate 5MB/s high density packing
    const fps = 30;
    const compressionDuration = 3000; // 3 seconds mock encode
    const intervalTime = 100;
    const steps = compressionDuration / intervalTime;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setPayloadProgress(Math.min((currentStep / steps) * 100, 100));
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          setShowResult(true);
        }, 500);
      }
    }, intervalTime);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-orange-900 selection:text-orange-400 relative">
      <AutoDestructTracker onDestruct={handleDestruct} colorTheme="orange" />
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 border border-orange-900 p-2 rounded-lg bg-black hover:bg-gray-800 transition shadow-[0_0_10px_rgba(249,115,22,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </Link>
          <div className="w-8 h-8 bg-orange-500 rounded-sm flex items-center justify-center font-bold text-black border border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]">VV</div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'var(--font-rajdhani)' }}>
            Video Vault
          </h1>
        </div>
      </header>

      <main className="flex-grow p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
        {!showResult ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Left Column: Dropzone */}
               <div className="flex flex-col gap-6">
                 <h2 className="text-2xl font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                   Target Carrier Upload
                 </h2>
                 
                 <div 
                   onDragOver={onDragOver}
                   onDrop={onDrop}
                   className={`relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all bg-gray-950 ${videoFile ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900'}`}
                 >
                   <input 
                     type="file" 
                     accept=".mp4,.avi" 
                     onChange={(e) => e.target.files && handleFileDrop(e.target.files[0])}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                   />
                   {!videoFile ? (
                     <div className="text-center p-6 flex flex-col items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-orange-500/60 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        <p className="text-gray-300 font-bold mb-1 uppercase tracking-wider">Drag & Drop Target Matrix</p>
                        <p className="text-gray-500 text-sm">Strict limits: .MP4 / .AVI Only</p>
                     </div>
                   ) : (
                     <div className="text-center p-6 flex flex-col items-center pointer-events-none text-orange-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <p className="font-mono text-sm break-all font-bold truncate max-w-full px-4">{videoFile.name}</p>
                        <span className="text-gray-500 text-xs uppercase tracking-widest mt-2 border border-orange-900 bg-black px-3 py-1 rounded-full text-orange-500">{(videoFile.size / 1024 / 1024).toFixed(2)} MB Selected</span>
                     </div>
                   )}
                 </div>
               </div>

               {/* Right Column: Settings & Meter */}
               <div className="flex flex-col gap-6">
                 <h2 className="text-2xl font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                   Steganographic Configuration
                 </h2>

                 <div className="flex flex-col gap-5">
                   <div>
                     <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Deterministic Seed Passcode</label>
                     <input 
                       type="password" 
                       value={passcode}
                       onChange={(e) => setPasscode(e.target.value)}
                       className="w-full bg-black border border-gray-800 text-orange-400 font-mono p-4 rounded-xl focus:outline-none focus:border-orange-500 transition shadow-inner placeholder-gray-700 selection:bg-orange-900"
                       placeholder="Enter AES-256 Key..."
                     />
                   </div>
                   
                   <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 flex flex-col gap-4 mt-2">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                           <span className="font-bold uppercase tracking-wider text-white text-sm">Payload Capacity Meter</span>
                        </div>
                        <span className="text-orange-400 font-mono text-xs border border-orange-900/50 bg-orange-900/10 px-2 py-0.5 rounded">BANDWIDTH: 5MB/s</span>
                     </div>

                     <p className="text-xs text-gray-500 leading-relaxed">
                       Advanced spatial matrix tracking allows up to 5 Megabytes per second of raw data to be safely intertwined across the frame sequence via algorithmic density mapping.
                     </p>

                     {/* Progress Bar Container */}
                     <div className="w-full h-8 bg-black border border-gray-800 rounded-lg overflow-hidden relative shadow-inner p-1">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded transition-all duration-[100ms] ease-linear relative flex items-center justify-end pr-2 overflow-hidden"
                          style={{ width: `${payloadProgress}%` }}
                        >
                           <div className="absolute top-0 right-0 w-full h-full opacity-30 shadow-[inset_-10px_0_20px_rgba(255,255,255,1)]"></div>
                           {isProcessing && payloadProgress > 10 && <span className="text-[10px] font-bold text-black mix-blend-color-burn uppercase">Infiltrating Frames...</span>}
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {!isProcessing && (
              <div className="mt-8 pt-8 border-t border-gray-900 flex justify-end">
                 <button 
                   onClick={onExecute}
                   disabled={!videoFile || !passcode}
                   className="w-full md:w-auto md:px-16 py-5 bg-orange-600 hover:bg-orange-500 text-black font-bold uppercase tracking-widest text-lg rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                 >
                   <span className="relative z-10">Execute Sub-Level Weave</span>
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                 </button>
              </div>
            )}
          </>
        ) : (
          /* Success Screen & Video Player */
          <div className="flex flex-col animate-in fade-in zoom-in-95 duration-500 relative z-10 h-full w-full max-w-4xl mx-auto">
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)]"></div>
               
               <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-800 pb-6 mb-8 gap-4">
                  <div className="flex items-center gap-4 text-white">
                     <div className="p-3 bg-orange-500/20 rounded-lg border border-orange-500/50 text-orange-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-orange-400" style={{ fontFamily: 'var(--font-rajdhani)' }}>Injection Complete.</h2>
                        <p className="text-gray-400 text-sm">Payload fused into 30 FPS array block structurally lossless.</p>
                     </div>
                  </div>
                  <button onClick={() => {setShowResult(false); setIsProcessing(false);}} className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm font-bold uppercase tracking-widest text-white transition whitespace-nowrap">
                    New Matrix
                  </button>
               </div>

               {/* Video Player Display */}
               <div className="flex flex-col gap-4">
                 <h3 className="text-lg font-semibold text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                   Secure Stealth Media Artifact
                 </h3>

                 <div className="bg-black border border-gray-800 rounded-lg p-2 shadow-inner aspect-video flex items-center justify-center relative overflow-hidden group">
                     {/* We use the original url as a visual proxy because it's a mock */}
                     {videoUrl ? (
                         <video 
                           src={videoUrl} 
                           controls 
                           className="w-full h-full object-contain rounded cursor-pointer"
                           autoPlay={false}
                         />
                     ) : (
                         <div className="text-gray-700 uppercase font-mono tracking-widest">NO MEDIA BUFFER</div>
                     )}
                 </div>

                 <div className="mt-4 p-5 bg-orange-950/10 border border-orange-900/30 rounded-lg flex gap-4 items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <p className="text-sm text-gray-300 leading-relaxed font-mono">
                      [SYS_VALIDATION]: Target frame matrices successfully reconstructed. Video bitstream integrity is 100% matched to original carrier physics. Proceed to download via native context menu or secure pipeline endpoints.
                    </p>
                 </div>
               </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
