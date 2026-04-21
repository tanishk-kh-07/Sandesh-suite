"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AutoDestructTracker from './components/AutoDestructTracker';
import { useToast } from './components/Toast';

export default function Home() {
  const router = useRouter();
  
  // Dashboard State
  const [dashboardMode, setDashboardMode] = useState<'encapsulate' | 'extract'>('encapsulate');
  
  const toast = useToast();

  // Extraction Protocol State
  const [extractMode, setExtractMode] = useState<'image' | 'audio'>('image');
  const [extractFile, setExtractFile] = useState<File | null>(null);
  const [extractPasscode, setExtractPasscode] = useState('');
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'cracking' | 'success'>('idle');
  const [decryptedPayload, setDecryptedPayload] = useState<string | null>(null);

  // Static Tailwind class maps (dynamic interpolation like `text-${var}-400` breaks JIT compilation)
  const colorMap = {
    image: {
      text: 'text-green-400',
      textBright: 'text-green-500',
      border: 'border-green-500/50',
      bg: 'bg-green-500/5',
      bgAccent: 'bg-green-500/20',
      bgMuted: 'bg-green-900/80',
      borderAccent: 'border-green-500/50',
      borderMuted: 'border-green-900/50',
      bgPanel: 'bg-green-950/10',
      focusBorder: 'focus:border-green-500',
      btnBg: 'bg-green-600',
      btnHover: 'hover:bg-green-500',
      sideBar: 'bg-green-500',
    },
    audio: {
      text: 'text-blue-400',
      textBright: 'text-blue-500',
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/5',
      bgAccent: 'bg-blue-500/20',
      bgMuted: 'bg-blue-900/80',
      borderAccent: 'border-blue-500/50',
      borderMuted: 'border-blue-900/50',
      bgPanel: 'bg-blue-950/10',
      focusBorder: 'focus:border-blue-500',
      btnBg: 'bg-blue-600',
      btnHover: 'hover:bg-blue-500',
      sideBar: 'bg-blue-500',
    },
  };
  const cc = colorMap[extractMode];

  const handleDestruct = () => {
     // Wipe all highly sensitive state
     setExtractFile(null);
     setExtractPasscode('');
     setExtractionStatus('idle');
     setDecryptedPayload(null);
  };

  const handleInitialize = (vaultName: string) => {
    if (vaultName === 'Pixel Vault') {
      router.push('/pixel-vault');
      return;
    }
    if (vaultName === 'Audio Vault') {
      router.push('/audio-vault');
      return;
    }
  };

  const MAX_EXTRACT_SIZE = 3.5 * 1024 * 1024; // 3.5MB

  const onExtractDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (extractMode === 'image' && !dropped.type.match('image/(png|bmp)')) {
          toast.error('Invalid format. Image retrieval requires .png or .bmp');
          return;
      }
      if (extractMode === 'audio' && !dropped.type.match('audio/wav') && !dropped.name.endsWith('.wav')) {
          toast.error('Invalid format. Audio retrieval requires .wav');
          return;
      }
      if (dropped.size > MAX_EXTRACT_SIZE) {
          toast.error('File exceeds 3.5MB cloud limit.');
          return;
      }
      setExtractFile(dropped);
      setExtractionStatus('idle');
    }
  };

  const handleExecuteExtraction = async () => {
    if (!extractFile) {
        toast.error('Vault Breach Failed: Artifact missing.');
        return;
    }
    if (!extractPasscode) {
        toast.error('Vault Breach Failed: Invalid Passcode.');
        return;
    }

    setExtractionStatus('cracking');

    try {
        const formData = new FormData();
        formData.append('file', extractFile);
        formData.append('passcode', extractPasscode);

        const endpoint = extractMode === 'image' ? '/api/vault/extract' : '/api/audio/extract';
        const res = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        
        // Handle Plausible Deniability response (200 OK but success is false)
        if (res.ok && data.success === false) {
            setExtractionStatus('idle');
            toast.error(data.message || 'No secure payload detected or invalid passcode.');
            return;
        }

        if (!res.ok) {
            throw new Error(data.error || 'Extraction failed');
        }

        setDecryptedPayload(data.payload);
        setExtractionStatus('success');
        toast.success('Matrix Cracked Successfully.');
    } catch (err: unknown) {
        setExtractionStatus('idle');
        const msg = err instanceof Error ? err.message : 'Integrity Check Failed / Corrupted File';
        toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-green-900 selection:text-green-400 relative">
      <AutoDestructTracker onDestruct={handleDestruct} colorTheme="red" />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-sm flex items-center justify-center font-bold text-black border border-green-400 shadow-[0_0_10px_rgba(0,255,65,0.5)]">
            SS
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white uppercase" style={{ fontFamily: 'var(--font-rajdhani)' }}>
            Sandesh Suite
          </h1>
        </div>
        <div className="hidden md:flex">
          <p className="text-sm font-semibold tracking-[0.2em] text-green-500 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Innovate. Disrupt. Secure.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-10">
        
        {/* Intro Section */}
        <section className="flex flex-col gap-6 text-center items-center pt-8 pb-4">
          <div className="flex flex-col gap-3">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight uppercase" style={{ fontFamily: 'var(--font-rajdhani)' }}>
               Classified Operations
            </h2>
            <p className="text-gray-400 max-w-2xl text-lg md:text-xl mx-auto">
              Deploy advanced cryptographic steganography combined with AES-256 encryption. Select your operational mode below.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex bg-gray-950 p-1.5 rounded-full border border-gray-800 shadow-inner">
             <button 
               onClick={() => setDashboardMode('encapsulate')}
               className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${dashboardMode === 'encapsulate' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Encapsulate (Encrypt)
             </button>
             <button 
               onClick={() => setDashboardMode('extract')}
               className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${dashboardMode === 'extract' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Secure Retrieval (Extract)
             </button>
          </div>
        </section>

        {dashboardMode === 'encapsulate' ? (
          <>
            {/* Dashboard Cards Grid View */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Pixel Vault */}
              <div className="group relative bg-gray-950 border border-gray-800 hover:border-green-500/50 rounded-xl overflow-hidden transition duration-500 hover:shadow-[0_0_30px_rgba(0,255,65,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="p-8 md:p-6 lg:p-8 flex flex-col gap-6 h-full relative z-10">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 group-hover:border-green-500/30 transition duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-rajdhani)' }}>Pixel Vault</h3>
                  </div>
                  <p className="text-gray-400 text-sm lg:text-base leading-relaxed flex-grow">
                    Embed highly classified data within standard image carriers using advanced LSB matching. Undetectable visually and statistically resilient.
                  </p>
                  <button onClick={() => handleInitialize('Pixel Vault')} className="mt-2 px-4 py-3 lg:px-6 lg:py-4 w-full bg-black border border-gray-800 hover:bg-green-500 hover:text-black hover:border-green-500 font-bold uppercase tracking-widest text-xs lg:text-sm rounded-lg transition duration-300">
                    Initialize Vector
                  </button>
                </div>
              </div>

              {/* Audio Vault */}
              <div className="group relative bg-gray-950 border border-gray-800 hover:border-blue-500/50 rounded-xl overflow-hidden transition duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="p-8 md:p-6 lg:p-8 flex flex-col gap-6 h-full relative z-10">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 group-hover:border-blue-500/30 transition duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-rajdhani)' }}>Audio Vault</h3>
                  </div>
                  <p className="text-gray-400 text-sm lg:text-base leading-relaxed flex-grow">
                    Conceal payloads within uncompressed audio streams using Temporal Scattering. Bypasses standard acoustic analysis and waveform anomaly detection.
                  </p>
                  <button onClick={() => handleInitialize('Audio Vault')} className="mt-2 px-4 py-3 lg:px-6 lg:py-4 w-full bg-black border border-gray-800 hover:bg-blue-500 hover:text-black hover:border-blue-500 font-bold uppercase tracking-widest text-xs lg:text-sm rounded-lg transition duration-300">
                    Initialize Vector
                  </button>
                </div>
              </div>

            </section>

            {/* Interception Trap Notice */}
            <section className="mt-10 border border-red-900/50 bg-red-950/20 rounded-xl p-6 md:p-8 relative overflow-hidden backdrop-blur-sm group hover:bg-red-950/30 transition duration-300 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                <div className="p-4 bg-red-950/50 rounded-full border border-red-900/50 flex-shrink-0 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-red-500 uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-rajdhani)' }}>Security Notice: Interception Trap Active</h4>
                  <p className="text-gray-300/90 leading-relaxed text-lg">
                    Unauthorized extraction attempts will trigger the <strong>Interception Trap</strong> mechanism. Any cryptanalysis or brute-force operation against the payload container without the valid deterministic seed will execute an immediate data wipe, severing all retrieval paths. Proceed with maximum operational security.
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Secure Retrieval UI (Extract Mode) - Identical rendering logic to standard view handling */
          <section className="max-w-4xl mx-auto w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-12">
             
             {/* Extraction Header Toggle */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-6 gap-4">
                <h3 className="text-2xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-rajdhani)' }}>Decryption Protocol</h3>
                <div className="flex bg-gray-950 p-2 rounded-xl border border-gray-800 gap-2 overflow-x-auto">
                   <button 
                     onClick={() => { setExtractMode('image'); setExtractFile(null); setExtractionStatus('idle'); }}
                     className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition ${extractMode === 'image' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                     Image Vault
                   </button>
                   <button 
                     onClick={() => { setExtractMode('audio'); setExtractFile(null); setExtractionStatus('idle'); }}
                     className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition ${extractMode === 'audio' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                     Audio Vault
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Artifact Dropzone */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onExtractDrop}
                  className={`relative bg-gray-950 border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-all ${extractFile ? `${cc.border} ${cc.bg}` : 'border-gray-700 hover:border-gray-500'}`}
                >
                  <input 
                    type="file" 
                    accept={extractMode === 'image' ? '.png, .bmp' : '.wav'}
                    onChange={(e) => e.target.files && onExtractDrop({ preventDefault: () => {}, dataTransfer: { files: e.target.files } } as any)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {!extractFile ? (
                    <div className="text-center flex flex-col items-center p-6 text-gray-500 pointer-events-none">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                       <p className="font-semibold text-gray-300">Upload Encrypted Artifact</p>
                       <p className="text-xs mt-1">Requires {extractMode === 'image' ? 'lossless .PNG / .BMP' : '.WAV format'}</p>
                    </div>
                  ) : (
                    <div className={`text-center flex flex-col items-center p-6 pointer-events-none ${cc.text}`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                       <p className="font-mono font-bold truncate max-w-[200px]" title={extractFile.name}>{extractFile.name}</p>
                       <span className="text-gray-500 text-xs uppercase tracking-widest mt-2 border border-gray-800 bg-black px-2 py-1 rounded">Artifact Secured</span>
                    </div>
                  )}
                </div>

                {/* Right: Multi-Factor Decryption Forms */}
                <div className="flex flex-col gap-5">
                   <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 shadow-inner flex flex-col gap-5 relative overflow-visible h-full">
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-gray-900"></div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">SANDESH Passcode</label>
                        <input 
                          type="password" 
                          value={extractPasscode}
                          onChange={(e) => { setExtractPasscode(e.target.value); setExtractionStatus('idle'); }}
                          disabled={extractionStatus === 'cracking'}
                          className={`w-full bg-black border border-gray-800 ${cc.text} font-mono p-4 rounded-lg focus:outline-none ${cc.focusBorder} transition disabled:opacity-50`}
                          placeholder="Deterministic Seed Key..."
                        />
                      </div>
                      

                   </div>
                </div>
             </div>

             {/* Decryption Status Area */}
             <div className="mt-2 border-t border-gray-900 pt-8 flex flex-col">
                
                {extractionStatus === 'idle' && (
                   <button 
                     onClick={handleExecuteExtraction}
                     disabled={!extractFile || !extractPasscode}
                     className={`w-full md:w-auto md:px-16 py-5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white font-bold uppercase tracking-widest rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed mx-auto shadow-xl ${extractFile && extractPasscode ? 'hover:border-gray-500' : ''}`}
                   >
                     Submit to Extraction Engine
                   </button>
                )}

                {extractionStatus === 'cracking' && (
                   <div className="flex flex-col items-center justify-center p-8 border border-red-900/50 bg-red-950/10 rounded-xl max-w-lg mx-auto w-full">
                      <svg className="animate-spin h-10 w-10 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <h4 className="text-xl font-bold text-red-500 uppercase tracking-widest animate-pulse text-center" style={{ fontFamily: 'var(--font-rajdhani)' }}>Cracking the Vault...</h4>
                      <p className="text-gray-500 uppercase text-xs mt-2 tracking-widest font-mono text-center">Bypassing Protocol // Decrypting Bitstream</p>
                   </div>
                )}

                {extractionStatus === 'success' && (
                   <div className={`flex flex-col animate-in fade-in zoom-in duration-500 border ${cc.borderMuted} ${cc.bgPanel} rounded-xl p-8 max-w-2xl mx-auto w-full relative overflow-hidden`}>
                       <div className={`absolute top-0 left-0 w-1 h-full ${cc.sideBar}`}></div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-gray-800 pb-5 mb-6">
                         <div className={`${cc.bgAccent} p-4 rounded-full border ${cc.borderAccent} ${cc.text} inline-flex self-start`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                         </div>
                         <div>
                            <h4 className={`text-2xl font-bold ${cc.text} uppercase tracking-widest`} style={{ fontFamily: 'var(--font-rajdhani)' }}>Seal Intact. Extraction Valid.</h4>
                            <p className="text-gray-400 text-sm mt-1">Payload cleanly severed from target matrix.</p>
                         </div>
                      </div>

                      <div className={`mb-8 w-full relative group`}>
                         <div className={`absolute -inset-1 bg-gradient-to-r ${cc.btnBg === 'bg-green-600' ? 'from-green-600 to-green-400' : 'from-blue-600 to-blue-400'} rounded-xl blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200`}></div>
                         <div className="relative bg-black rounded-lg border border-gray-800 p-6 shadow-inner">
                             <span className={`text-xs font-bold text-white uppercase tracking-widest px-2 py-1 ${cc.bgMuted} rounded absolute -top-3 left-4 border ${cc.borderAccent}`}>
                                [ DECLASSIFIED PAYLOAD ]
                             </span>
                             
                             {extractMode === 'image' ? (
                                 <textarea 
                                   readOnly
                                   value={decryptedPayload || ''}
                                   className={`w-full min-h-[120px] bg-transparent border-none ${cc.text} font-mono focus:outline-none resize-none pt-2`}
                                 />
                             ) : (
                                 <div className="flex flex-col gap-4 pt-2">
                                    <audio controls src={`data:audio/wav;base64,${decryptedPayload}`} className="w-full" />
                                    <a href={`data:audio/wav;base64,${decryptedPayload}`} download="Declassified-Audio.wav" className={`text-center text-xs ${cc.text} hover:text-white uppercase tracking-widest border border-gray-800 bg-gray-950 hover:bg-gray-900 py-2 rounded transition`}>
                                       Download Raw Auditory Payload
                                    </a>
                                 </div>
                             )}
                         </div>
                      </div>

                      <button 
                        onClick={() => { setExtractionStatus('idle'); setExtractFile(null); setExtractPasscode(''); setDecryptedPayload(null); }}
                        className={`w-full py-5 ${cc.btnBg} ${cc.btnHover} text-black font-bold uppercase tracking-widest text-sm sm:text-lg rounded-xl transition duration-300 flex items-center justify-center gap-3`}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                         Success! Download Extracted Message
                      </button>
                   </div>
                )}
             </div>

          </section>
        )}

      </main>

    </div>
  );
}
