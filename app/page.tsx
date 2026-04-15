import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-green-900 selection:text-green-400">
      
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
        <section className="flex flex-col gap-4 text-center items-center py-12 md:py-16">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight uppercase" style={{ fontFamily: 'var(--font-rajdhani)' }}>
             Classified Operations
          </h2>
          <p className="text-gray-400 max-w-2xl text-lg md:text-xl">
            Deploy advanced cryptographic steganography combined with AES-256 encryption. Select your payload distribution vector below.
          </p>
        </section>

        {/* Dashboard Cards Split View */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          {/* Pixel Vault */}
          <div className="group relative bg-gray-950 border border-gray-800 hover:border-green-500/50 rounded-xl overflow-hidden transition duration-500 hover:shadow-[0_0_30px_rgba(0,255,65,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="p-8 md:p-10 flex flex-col gap-6 h-full relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 group-hover:border-green-500/30 transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </div>
                <h3 className="text-3xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-rajdhani)' }}>Pixel Vault</h3>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed flex-grow">
                Embed highly classified data within standard image carriers using advanced LSB matching. Undetectable visually and statistically resilient.
              </p>
              <button className="mt-4 px-6 py-4 w-full bg-black border border-gray-800 group-hover:bg-green-500 group-hover:text-black group-hover:border-green-500 font-bold uppercase tracking-widest text-sm rounded-lg transition duration-300">
                Initialize Vector
              </button>
            </div>
          </div>

          {/* Audio Vault */}
          <div className="group relative bg-gray-950 border border-gray-800 hover:border-blue-500/50 rounded-xl overflow-hidden transition duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="p-8 md:p-10 flex flex-col gap-6 h-full relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 group-hover:border-blue-500/30 transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                </div>
                <h3 className="text-3xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-rajdhani)' }}>Audio Vault</h3>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed flex-grow">
                Conceal payloads within uncompressed audio streams using Temporal Scattering. Bypasses standard acoustic analysis and waveform anomaly detection.
              </p>
              <button className="mt-4 px-6 py-4 w-full bg-black border border-gray-800 group-hover:bg-blue-500 group-hover:text-black group-hover:border-blue-500 font-bold uppercase tracking-widest text-sm rounded-lg transition duration-300">
                Initialize Vector
              </button>
            </div>
          </div>
          
        </section>

        {/* Interception Trap Notice */}
        <section className="mt-12 border border-red-900/50 bg-red-950/20 rounded-xl p-6 md:p-8 relative overflow-hidden backdrop-blur-sm group hover:bg-red-950/30 transition duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>
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

      </main>

    </div>
  );
}
