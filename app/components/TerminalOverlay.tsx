"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function TerminalOverlay({ colorTheme = 'green' }: { colorTheme?: 'green' | 'blue' | 'red' }) {
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const colorConfig = {
    green: { text: 'text-green-500', bgLine: 'via-green-500', shadow: 'shadow-[0_0_15px_rgba(0,255,65,1)]', border: 'border-green-900/50' },
    blue: { text: 'text-blue-500', bgLine: 'via-blue-500', shadow: 'shadow-[0_0_15px_rgba(59,130,246,1)]', border: 'border-blue-900/50' },
    red: { text: 'text-red-500', bgLine: 'via-red-500', shadow: 'shadow-[0_0_15px_rgba(220,38,38,1)]', border: 'border-red-900/50' },
  };

  useEffect(() => {
    const sequence = [
      '> [SYSTEM] Initializing Encapsulation Protocol...',
      '> [AES-256] Initializing CTR Mode...',
      '> [PBKDF2] Stretching Key (Round 45,021)...',
      '> [PBKDF2] Stretching Key (Round 89,992)...',
      '> [AUTH] Deterministic Seed Validated.',
      '> [VECTOR] Generating Pseudorandom Transposition Map...',
      '> [MATRIX] Identifying Optimal Structural Injections...',
      '> [COMPRESSION] Balancing Data Block Densities...',
      '> [LSB] Injecting Payload at Cryptographic Depth...',
      '> [OBFUSCATION] Masking Statistical Entropy Variance...',
      '> [INTEGRITY] Recalculating Matrix Signatures...',
      '> [SYSTEM] Digital Seal Affixed. Vault Hardened.'
    ];

    let currentStep = 0;
    
    // Rapid-fire sequence simulation
    const interval = setInterval(() => {
      if (currentStep < sequence.length) {
        setLogs(prev => [...prev, sequence[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const cfg = colorConfig[colorTheme];

  return (
    <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className={`text-xl font-bold ${cfg.text} uppercase tracking-wider mb-2 border-b ${cfg.border} pb-2`} style={{ fontFamily: 'var(--font-rajdhani)' }}>
        Live Network Activity
      </h2>
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 md:p-6 font-mono text-xs md:text-sm leading-relaxed shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden h-64 relative flex flex-col">
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${cfg.bgLine} to-transparent ${cfg.shadow}`}></div>
          <div className="flex flex-col gap-2 relative z-10 overflow-y-auto flex-grow pr-2 custom-scrollbar">
            <div className={`${cfg.text} font-bold mb-2`}>--- SECURE CHANNEL ESTABLISHED ---</div>
            {logs.map((log, i) => (
              <div key={i} className="text-gray-400 animate-in fade-in slide-in-from-bottom-1 duration-200">
                {log}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
      </div>
    </div>
  );
}
