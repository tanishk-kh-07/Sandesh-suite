import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sandesh Suite | Cyber-Fortified",
  description: "High-security tool integrating cryptographic steganography and AES-256 encryption.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${rajdhani.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-black text-gray-100">
        <div className="flex-grow">{children}</div>
        <footer className="border-t border-gray-900 bg-gray-950 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
             <p className="text-gray-600 text-xs font-mono tracking-widest uppercase">Sandesh Suite v3.2.0-Alpha</p>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border border-green-900/50 bg-green-950/20 px-3 py-1.5 rounded-md">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(0,255,65,0.8)]"></div>
                   <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">TLS/SSL E2E Encrypted</span>
                </div>
                <div className="flex items-center gap-2 border border-gray-800 bg-black px-3 py-1.5 rounded-md">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Zero-Persistence Environment</span>
                </div>
             </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
