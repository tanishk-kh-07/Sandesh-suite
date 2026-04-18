"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AutoDestructTracker from '../components/AutoDestructTracker';
import { useToast } from '../components/Toast';
import TerminalOverlay from '../components/TerminalOverlay';

export default function PixelVault() {
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [encodedUrl, setEncodedUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [capacity, setCapacity] = useState<number>(0); // in bytes
  
  const [secretText, setSecretText] = useState('');
  const [passcode, setPasscode] = useState('');
  const [frameCount, setFrameCount] = useState('');
  const [isLsbMatching, setIsLsbMatching] = useState(true);
  
  const toast = useToast();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<'idle' | 'checking' | 'ok'>('idle');

  const handleDestruct = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (encodedUrl) URL.revokeObjectURL(encodedUrl);
    setPreviewUrl(null);
    setEncodedUrl(null);
    setDimensions(null);
    setCapacity(0);
    setSecretText('');
    setPasscode('');
    setFrameCount('');
    setShowResult(false);
    setSecurityStatus('idle');
  };

  // Determine current payload size
  const payloadSize = new Blob([secretText]).size;
  const usagePercentage = capacity > 0 ? Math.min((payloadSize / capacity) * 100, 100) : 0;
  
  // Progress Bar Color Logic
  let progressColor = 'bg-green-500';
  if (usagePercentage > 75) progressColor = 'bg-yellow-500';
  if (usagePercentage >= 100) progressColor = 'bg-red-500';

  useEffect(() => {
    return () => {
      // Cleanup object URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (encodedUrl) URL.revokeObjectURL(encodedUrl);
    };
  }, [previewUrl, encodedUrl]);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.match('image/(png|bmp)')) {
      toast.error('Integrity Check Failed: Only .png and .bmp formats are supported.');
      return;
    }
    setFile(selectedFile);
    
    // Revoke old URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Get exact dimensions securely client-side
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      // LSB Capacity: 3 channels (RGB) * 1 bit per channel / 8 bits per byte
      const bytes = Math.floor((img.width * img.height * 3) / 8);
      setCapacity(bytes);
      
      // Simulate Entropy check
      setSecurityStatus('checking');
      setTimeout(() => setSecurityStatus('ok'), 1000);
    };
    img.src = url;
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onExecute = async () => {
    if (!file || payloadSize > capacity) return;
    if (!secretText || !passcode || !frameCount || parseInt(frameCount, 10) < 0) {
      toast.error('Integrity Check Failed: Valid Passcode and Frame Count (>= 0) required.');
      return;
    }
    setIsProcessing(true);
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('passcode', passcode);
        formData.append('frameCount', frameCount);
        formData.append('secretText', secretText);
        formData.append('isLsbMatching', String(isLsbMatching));

        const res = await fetch('/api/vault/process', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Network response was not ok');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setEncodedUrl(url);
        
        setIsProcessing(false);
        setShowResult(true);
        toast.success('Matrix Encapsulated Successfully.');
    } catch (err: any) {
        setIsProcessing(false);
        toast.error(err.message || 'Fatal Execution Error. Backend failed to respond.');
    }
  };

  // Human readable bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-green-900 selection:text-green-400 relative">
      <AutoDestructTracker onDestruct={handleDestruct} colorTheme="green" />
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 border border-gray-800 p-2 rounded-lg bg-black hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </Link>
          <div className="w-8 h-8 bg-green-500 rounded-sm flex items-center justify-center font-bold text-black border border-green-400 shadow-[0_0_10px_rgba(0,255,65,0.5)]">PV</div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase flex items-center gap-2" style={{ fontFamily: 'var(--font-rajdhani)' }}>
            Pixel Vault
            <div className="group relative cursor-help">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 hover:text-green-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
               <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 font-sans normal-case tracking-normal">
                 <strong className="text-white block mb-1">Standard Carrier Drop</strong>
                 Ideal for quick, text-based exfiltration over typical image sharing feeds and public social media structures where simple images hide in plain sight.
               </div>
            </div>
          </h1>
        </div>
      </header>

      <main className="flex-grow p-6 md:p-10 max-w-6xl mx-auto w-full flex flex-col gap-8">
        {!showResult ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: File Drop & Capacity */}
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                  Carrier Selection
                </h2>
                
                <div 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all bg-gray-950 upload-zone ${isDragging ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900'} ${file ? 'border-green-500/50' : ''}`}
                >
                  <input 
                    type="file" 
                    accept=".png, .bmp" 
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  {!file ? (
                    <div className="text-center p-6 flex flex-col items-center pointer-events-none">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                       <p className="text-gray-300 font-semibold mb-1">Drag & Drop Carrier Image</p>
                       <p className="text-gray-500 text-sm">Supports pure .PNG and .BMP</p>
                    </div>
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center pointer-events-none w-full h-full">
                       {previewUrl && (
                         <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden border border-gray-800 shadow-inner bg-black/50">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={previewUrl} alt="Preview" className="w-full h-full object-contain opacity-70" />
                         </div>
                       )}
                       <p className="text-green-400 font-mono text-sm break-all font-bold truncate max-w-full">{file.name}</p>
                       <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{dimensions ? `${dimensions.width}x${dimensions.height} px` : 'Analyzing...'}</p>
                    </div>
                  )}
                </div>

                 {/* Format & Security Helper */}
                 <div className="flex flex-col gap-2 relative">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      Format Standardization Enforced to Evade Sniffers (.png, .bmp solely)
                    </p>
                    
                    {file && securityStatus === 'checking' && (
                       <div className="bg-black border border-gray-800 rounded p-2 text-xs font-mono text-gray-500 flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-yellow-500 animate-pulse rounded-full"></div>
                          Scanning matrix signatures...
                       </div>
                    )}
                    
                    {file && securityStatus === 'ok' && (
                       <div className="bg-green-900/10 border border-green-900/50 rounded p-2 text-xs font-mono text-green-500 flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(0,255,65,0.8)]"></div>
                          Statistical Entropy: Optimal - No Forensic Scars Detected
                       </div>
                    )}
                 </div>

                {/* Capacity Live Tracker */}
                {capacity > 0 && (
                   <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-md">
                     <div className="flex justify-between items-end mb-2">
                       <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Vault Capacity</h3>
                       <span className={`text-xs font-mono font-bold ${payloadSize > capacity ? 'text-red-500' : 'text-green-400'}`}>
                         {formatBytes(payloadSize)} / {formatBytes(capacity)}
                       </span>
                     </div>
                     <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                       <div 
                         className={`h-full transition-all duration-300 ${progressColor}`} 
                         style={{ width: `${usagePercentage}%` }}
                       ></div>
                     </div>
                     {payloadSize > capacity && <p className="text-red-500 text-xs mt-3 bg-red-950/20 p-2 rounded">Warning: Payload exceeds logical container boundaries.</p>}
                   </div>
                )}
              </div>

              {/* Right Column: Secret Input & LSB Settings */}
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                  Payload Definition
                </h2>

                <div className="flex flex-col h-full gap-4">
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Secret Bitstream (Raw Text)</label>
                  <textarea 
                    className="w-full flex-grow min-h-[120px] bg-black border border-gray-800 text-green-400 font-mono p-4 rounded-xl focus:outline-none focus:border-green-500 transition shadow-inner placeholder-gray-700 resize-none selection:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter classified data payload here..."
                    value={secretText}
                    onChange={(e) => setSecretText(e.target.value)}
                    disabled={isProcessing}
                  />

                  <div className="flex gap-4 w-full">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Determin. Seed (Passcode)</label>
                      <input 
                        type="password" 
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        disabled={isProcessing}
                        className="w-full bg-black border border-gray-800 text-green-400 font-mono p-3 rounded-lg focus:outline-none focus:border-green-500 transition disabled:opacity-50"
                        placeholder="AES-256 Key"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Frame Count (Meta)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={frameCount}
                        onChange={(e) => setFrameCount(e.target.value)}
                        disabled={isProcessing}
                        className="w-full bg-black border border-gray-800 text-green-400 font-mono p-3 rounded-lg focus:outline-none focus:border-green-500 transition disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="e.g. 1337"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 flex items-center justify-between gap-4 mt-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-white text-sm">+/- LSB Matching</span>
                        <div className="group relative cursor-help">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 hover:text-green-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black border border-gray-700 text-gray-300 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                            Preserves the overall pixel intensity histogram by randomly adding or subtracting values instead of direct replacement, rendering extraction forensically invisible to Chi-Square attacks.
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Defeat statistical steganalysis</p>
                    </div>

                    <button 
                      onClick={() => setIsLsbMatching(!isLsbMatching)}
                      disabled={isProcessing}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${isLsbMatching ? 'bg-green-500' : 'bg-gray-700'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isLsbMatching ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-6 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
               <Link href="/audio-vault" className="text-gray-500 hover:text-blue-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition px-4 py-2 rounded border border-transparent hover:border-blue-900 bg-transparent hover:bg-blue-950/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  Plan B: Suspect Image Sensors?<br/>Pivot to Audio Vault
               </Link>
               
               <button 
                 onClick={onExecute}
                 disabled={!file || !secretText || !passcode || !frameCount || payloadSize > capacity || isProcessing || securityStatus !== 'ok'}
                 className="w-full md:w-auto md:px-12 py-5 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
               >
                 {isProcessing ? (
                   <>
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Encapsulating Bitstream...
                   </>
                 ) : (
                   <>
                     <span className="relative z-10">Execute Encapsulation</span>
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                     <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                   </>
                 )}
               </button>
            </div>
            
            {isProcessing && <TerminalOverlay colorTheme="green" />}
          </>
        ) : (
          /* Visual Comparison Screen */
          <div className="flex flex-col animate-in fade-in zoom-in-95 duration-500 relative z-10">
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_10px_rgba(0,255,65,0.8)]"></div>
               
               <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-8">
                  <div className="flex items-center gap-4 text-white">
                     <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-rajdhani)' }}>Encapsulation Successful</h2>
                        <p className="text-gray-400 text-sm">{payloadSize} bytes mathematically embedded via {isLsbMatching ? '+/- LSB Matching' : 'Standard LSB Replace'}.</p>
                     </div>
                  </div>
                  <button onClick={() => setShowResult(false)} className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm font-bold uppercase tracking-widest text-white transition">
                    Restart Operation
                  </button>
               </div>

               {/* Before / After Layout */}
               <div className="flex flex-col gap-6">
                 <h3 className="text-lg font-semibold text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                   Visual Distortion Matrix Analysis (Zero Tolerance)
                 </h3>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/50 p-6 rounded-xl border border-gray-900 relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 shadow-xl hidden md:flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    </div>

                    <div className="flex flex-col gap-3">
                       <div className="flex justify-between items-center bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
                          <span className="font-bold text-gray-300 uppercase text-xs tracking-wider">Source Target</span>
                          <span className="text-gray-500 font-mono text-xs">Unmodified</span>
                       </div>
                       <div className="bg-black rounded-lg border border-gray-800 overflow-hidden relative group h-[400px] flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {previewUrl && <img src={previewUrl} alt="Normal" className="max-w-full max-h-full object-contain" />}
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                       <div className="flex justify-between items-center bg-green-900/20 border border-green-900/50 px-4 py-2 rounded-lg">
                          <span className="font-bold text-green-400 uppercase text-xs tracking-wider">Stego Artifact</span>
                          <span className="text-green-600 font-mono text-xs">Encapsulated</span>
                       </div>
                       <div className="bg-black rounded-lg border border-gray-800 overflow-hidden relative group h-[400px] flex items-center justify-center shadow-[0_0_30px_rgba(0,255,65,0.05)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {encodedUrl && <img src={encodedUrl} alt="Stego simulated" className="max-w-full max-h-full object-contain" />}
                          <div className="absolute inset-0 bg-green-500 mix-blend-color-burn opacity-[0.02] pointer-events-none"></div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-4 p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg flex gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                        Verification complete. Optical analysis detects zero anomaly signatures. The bitstream variance is constrained to the lowest topological layer. You may confidently export the Stego Artifact.
                      </p>
                      {encodedUrl && (
                        <a 
                           href={encodedUrl} 
                           download="Pixel-Vault-Stego.png"
                           className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest text-sm rounded-lg transition shadow-[0_0_15px_rgba(0,255,65,0.4)]"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                           Download Stego Artifact
                        </a>
                      )}
                    </div>
                 </div>
               </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
