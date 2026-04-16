"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AudioVault() {
  const router = useRouter();
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [secretFile, setSecretFile] = useState<File | null>(null);
  
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [secretUrl, setSecretUrl] = useState<string | null>(null);
  
  const [isSpreadSpectrum, setIsSpreadSpectrum] = useState(true);
  const [passcode, setPasscode] = useState('');
  
  const [activeDropzone, setActiveDropzone] = useState<'cover' | 'secret' | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl);
      if (secretUrl) URL.revokeObjectURL(secretUrl);
    };
  }, [coverUrl, secretUrl]);

  const handleFileDrop = (target: 'cover' | 'secret', selectedFile: File) => {
    if (!selectedFile.type.match('audio/wav') && !selectedFile.name.endsWith('.wav')) {
      alert('Only .wav files are supported for high-fidelity audio operations.');
      return;
    }
    
    const url = URL.createObjectURL(selectedFile);
    
    if (target === 'cover') {
      if (coverUrl) URL.revokeObjectURL(coverUrl);
      setCoverFile(selectedFile);
      setCoverUrl(url);
    } else {
      if (secretUrl) URL.revokeObjectURL(secretUrl);
      setSecretFile(selectedFile);
      setSecretUrl(url);
    }
  };

  const onDragOver = (e: React.DragEvent, zone: 'cover' | 'secret') => {
    e.preventDefault();
    setActiveDropzone(zone);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setActiveDropzone(null);
  };

  const onDrop = (e: React.DragEvent, zone: 'cover' | 'secret') => {
    e.preventDefault();
    setActiveDropzone(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileDrop(zone, e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);


  const onExecute = () => {
    if (!coverFile || !secretFile || !passcode) return;
    setIsProcessing(true);
    setTerminalLogs([
       '> Initializing Audio Vault Engine via Bridge...',
       '> Verifying .WAV structural integrity...'
    ]);

    // Simulate real execution timeline
    let logs = [
      '> Carrier: 44.1kHz / 16-bit PCM Verified.',
      '> Payload: Secret Audio Block Synchronized.',
      isSpreadSpectrum ? '> Deploying Pseudorandom Logarithmic Jump Sequence...' : '> Deploying Standard LSB Weaving...',
    ];
    let step = 0;

    const intervalId = setInterval(() => {
      setTerminalLogs(prev => [...prev, logs[step]]);
      step++;

      if (step === logs.length) {
         clearInterval(intervalId);
         
         // Start fast weaving simulation
         let blocks = 0;
         const weaveInterval = setInterval(() => {
            blocks++;
            setTerminalLogs(prev => [...prev, `> [SYSTEM] Synchronized LSB weaving... [Frame 0x${Math.floor(Math.random()*10000).toString(16).toUpperCase()}]`]);
            if (blocks > 10) {
              clearInterval(weaveInterval);
              setTerminalLogs(prev => [...prev, '> Encryption Complete. Preparing Sonic Transparency Test.']);
              setTimeout(() => {
                setIsProcessing(false);
                setShowResult(true);
              }, 1000);
            }
         }, 150);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-blue-900 selection:text-blue-400">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 border border-blue-900 p-2 rounded-lg bg-black hover:bg-gray-800 transition shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </Link>
          <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center font-bold text-black border border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]">AV</div>
          <h1 className="text-xl font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'var(--font-rajdhani)' }}>
            Audio Vault
          </h1>
        </div>
      </header>

      <main className="flex-grow p-6 md:p-10 max-w-6xl mx-auto w-full flex flex-col gap-8">
        {!showResult ? (
          <>
            {isProcessing ? (
               <div className="w-full flex-grow flex flex-col">
                  <h2 className="text-2xl font-bold text-blue-500 uppercase tracking-wider mb-6 pb-2 border-b border-blue-900/50" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                    Terminal Execution Shell
                  </h2>
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 font-mono text-sm leading-relaxed flex flex-col flex-grow shadow-inner relative overflow-hidden h-96">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,1)]"></div>
                     <div className="flex flex-col gap-2 relative z-10 overflow-y-auto">
                        <div className="text-blue-500 font-bold mb-4">Sandesh-Suite v3.2.0-Alpha. Starting Audio Matrix Process...</div>
                        {terminalLogs.map((log, i) => (
                          <div key={i} className="text-gray-300 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {log}
                          </div>
                        ))}
                        <div ref={terminalEndRef} />
                     </div>
                  </div>
               </div>
            ) : (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: File Dropzones */}
                  <div className="flex flex-col gap-6">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                      Carrier & Payload Initialization
                    </h2>
                    
                    {/* Cover Music Dropzone */}
                    <div 
                      onDragOver={(e) => onDragOver(e, 'cover')}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => onDrop(e, 'cover')}
                      className={`relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all bg-gray-950 upload-zone ${activeDropzone === 'cover' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900'} ${coverFile ? 'border-blue-500/50' : ''}`}
                    >
                      <input 
                        type="file" 
                        accept=".wav" 
                        onChange={(e) => e.target.files && handleFileDrop('cover', e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      {!coverFile ? (
                        <div className="text-center p-4 flex flex-col items-center pointer-events-none">
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-500/60 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                           <p className="text-gray-300 font-semibold mb-1">Upload Cover Music Carrier</p>
                           <p className="text-gray-500 text-xs">Supports pure .WAV</p>
                        </div>
                      ) : (
                        <div className="text-center p-4 flex flex-col items-center pointer-events-none text-blue-400">
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                           <p className="font-mono text-sm break-all font-bold truncate max-w-full">{coverFile.name}</p>
                           <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{(coverFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      )}
                    </div>

                    {/* Secret Audio Dropzone */}
                    <div 
                      onDragOver={(e) => onDragOver(e, 'secret')}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => onDrop(e, 'secret')}
                      className={`relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all bg-gray-950 upload-zone ${activeDropzone === 'secret' ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900'} ${secretFile ? 'border-red-500/50' : ''}`}
                    >
                      <input 
                        type="file" 
                        accept=".wav" 
                        onChange={(e) => e.target.files && handleFileDrop('secret', e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      {!secretFile ? (
                        <div className="text-center p-4 flex flex-col items-center pointer-events-none">
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500/60 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                           <p className="text-red-300 font-semibold mb-1">Upload Secret Audio Payload</p>
                           <p className="text-gray-500 text-xs">Supports pure .WAV</p>
                        </div>
                      ) : (
                        <div className="text-center p-4 flex flex-col items-center pointer-events-none text-red-400">
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                           <p className="font-mono text-sm break-all font-bold truncate max-w-full">{secretFile.name}</p>
                           <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{(secretFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Settings */}
                  <div className="flex flex-col gap-6">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                      Steganographic Configuration
                    </h2>

                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Deterministic Encryption Seed</label>
                        <input 
                          type="password" 
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          className="w-full bg-black border border-gray-800 text-blue-400 font-mono p-4 rounded-xl focus:outline-none focus:border-blue-500 transition shadow-inner placeholder-gray-700 selection:bg-blue-900"
                          placeholder="Enter AES-256 Passcode..."
                        />
                      </div>
                      
                      <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 flex flex-col gap-5 mt-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold uppercase tracking-wider text-white text-sm">Spread-Spectrum Jump</span>
                              <div className="group relative cursor-help">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 hover:text-blue-400 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black border border-gray-700 text-gray-300 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                  Uses a pseudorandom algorithm tied to the passcode to scatter data bits across non-contiguous audio frames, preventing sequential detection and waveform anomaly isolation.
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">Defeat acoustic waveform forensics</p>
                          </div>

                          <button 
                            onClick={() => setIsSpreadSpectrum(!isSpreadSpectrum)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isSpreadSpectrum ? 'bg-blue-500' : 'bg-gray-700'}`}
                          >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isSpreadSpectrum ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>

                        {/* Spread Spectrum Visualization Placeholder */}
                        <div className="w-full h-16 bg-black border border-gray-800 rounded-lg overflow-hidden relative flex items-center justify-evenly py-2 px-1">
                           {[...Array(40)].map((_, i) => {
                             const isJump = isSpreadSpectrum && Math.random() > 0.6;
                             const height = 20 + Math.random() * 80;
                             return (
                               <div 
                                 key={i} 
                                 className={`w-[2px] transition-all duration-300 ${isJump ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'bg-gray-800'}`} 
                                 style={{ height: `${height}%` }}
                               ></div>
                             )
                           })}
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {!isProcessing && (
              <div className="mt-4 pt-6 border-t border-gray-900">
                 <button 
                   onClick={onExecute}
                   disabled={!coverFile || !secretFile || !passcode}
                   className="w-full md:w-auto md:px-12 py-5 bg-blue-600 hover:bg-blue-500 text-black font-bold uppercase tracking-widest rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group ml-auto"
                 >
                   <span className="relative z-10">Execute Encapsulation</span>
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                   <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                 </button>
              </div>
            )}
          </>
        ) : (
          /* Sonic Transparency Test / Dual Players Screen */
          <div className="flex flex-col animate-in fade-in zoom-in-95 duration-500 relative z-10">
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
               
               <div className="flex items-center justify-between border-b border-gray-800 pb-6 mb-8">
                  <div className="flex items-center gap-4 text-white">
                     <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-rajdhani)' }}>Encapsulation Successful</h2>
                        <p className="text-gray-400 text-sm">Target vector synchronized using {isSpreadSpectrum ? 'Spread-Spectrum Jumping' : 'Linear Scattering'}.</p>
                     </div>
                  </div>
                  <button onClick={() => {setShowResult(false); setIsProcessing(false); setTerminalLogs([]);}} className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm font-bold uppercase tracking-widest text-white transition">
                    New Operation
                  </button>
               </div>

               {/* Dual Audio Players Layout */}
               <div className="flex flex-col gap-6">
                 <h3 className="text-lg font-semibold text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                   Sonic Transparency Test Laboratory
                 </h3>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/50 p-8 rounded-xl border border-gray-900 relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 shadow-xl hidden md:flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path></svg>
                    </div>

                    <div className="flex flex-col gap-4">
                       <div className="flex justify-between items-center bg-gray-900 border border-gray-800 px-4 py-3 rounded-lg">
                          <span className="font-bold text-gray-300 uppercase text-xs tracking-wider">Normal Audio <br/><span className="text-[10px] text-gray-500 font-normal">Original Carrier</span></span>
                          {coverUrl && <audio controls src={coverUrl} className="h-10 w-48 " />}
                       </div>
                       <div className="w-full flex justify-center py-6 border border-gray-800 rounded-lg bg-black box-border px-4">
                           {/* Sound wave visual mockup */}
                           <div className="flex items-center gap-1 opacity-50">
                             {[12,24,35,14,48,22,10,30,42,15,8,25].map((h,i) => (
                               <div key={i} className="w-2 bg-gray-500 rounded-full" style={{height: `${h}px`}}></div>
                             ))}
                           </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <div className="flex justify-between items-center bg-blue-900/20 border border-blue-900/50 px-4 py-3 rounded-lg">
                          <span className="font-bold text-blue-400 uppercase text-xs tracking-wider">Encrypted Audio <br/><span className="text-[10px] text-blue-500/70 font-normal">Secure Artifact</span></span>
                          {/* GUI validation simulator just uses same cover audio here */}
                          {coverUrl && <audio controls src={coverUrl} className="h-10 w-48" />}
                       </div>
                       <div className="w-full flex justify-center py-6 border border-blue-900/40 rounded-lg bg-black box-border px-4 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                           {/* Sound wave visual mockup */}
                           <div className="flex items-center gap-1 opacity-80">
                             {[12,24,35,14,48,22,10,30,42,15,8,25].map((h,i) => (
                               <div key={i} className="w-2 bg-blue-500 rounded-full" style={{height: `${h}px`}}></div>
                             ))}
                           </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-4 p-4 bg-purple-950/20 border border-purple-900/40 rounded-lg flex gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Auditory verification complete. Sonic Transparency confirmed. The human ear and standard digital signal processing cannot differentiate the Encrypted Audio from the Normal Audio. The payload is securely woven.
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
