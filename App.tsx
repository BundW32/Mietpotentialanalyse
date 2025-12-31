
import React, { useState, useEffect, useRef } from 'react';
import InputForm from './components/InputForm';
import AnalysisResults from './components/AnalysisResults';
import { UserInput, AnalysisResult } from './types';
import { performAnalysis } from './services/geminiService';
import { Key, Sparkles, AlertCircle, RefreshCw, BarChart } from 'lucide-react';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.aistudio) {
      window.aistudio.hasSelectedApiKey()
        .then(setHasKey)
        .catch(() => setHasKey(false));
    } else {
      setHasKey(!!process.env.API_KEY);
    }
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleStartAnalysis = async (data: UserInput) => {
    setIsLoading(true);
    setError(null);
    setUserInput(data);
    setResult(null);

    try {
      const analysis = await performAnalysis(data);
      setResult(analysis);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (e: any) {
      console.error(e);
      setError("Analyse-Fehler: Die Marktdaten konnten nicht abgerufen werden.");
    } finally {
      setIsLoading(false);
    }
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
        <div className="glass-card max-w-md w-full p-12 rounded-[2.5rem] text-center space-y-8 border border-white/5 orange-glow">
           <div className="w-24 h-24 bg-[#f5931f]/10 rounded-full flex items-center justify-center mx-auto border border-[#f5931f]/20">
             <Key className="text-[#f5931f]" size={32} />
           </div>
           <div>
             <h1 className="text-2xl font-black text-white uppercase tracking-tight">Systemzugang</h1>
             <p className="text-slate-500 text-sm mt-3 leading-relaxed">
               Zur Aktivierung der KI-Potentialanalyse ist ein verifizierter API-Key erforderlich.
             </p>
           </div>
           <button 
             onClick={handleOpenKey}
             className="w-full py-5 bg-[#f5931f] text-white font-black rounded-2xl hover:bg-white hover:text-slate-950 transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
           >
             <Sparkles size={16} />
             Key Authentifizieren
           </button>
           <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
             Google Cloud Paid Tier Required
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] pb-24 selection:bg-[#f5931f]/30 font-sans text-slate-300">
      
      {/* Integrated Branding Area */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between border-b border-white/5 mb-10">
         <div className="flex items-center gap-4">
            <div className="h-14 w-14 group transition-transform hover:scale-105">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <rect x="30" y="10" width="40" height="80" fill="#034933" />
                <rect x="10" y="40" width="30" height="50" fill="#f5931f" />
                <rect x="60" y="30" width="30" height="60" fill="#f5931f" />
                <rect x="5" y="90" width="90" height="4" fill="#034933" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">B&W</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Immobilien Management</p>
            </div>
         </div>
         <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span className="text-[#f5931f]">AI Intelligence</span>
            <span>Market Grounding</span>
            <div className="h-8 w-[1px] bg-white/5"></div>
            <button className="px-6 py-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all text-white">
              Support
            </button>
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left: Input & Info */}
          <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-10">
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                 <span className="px-3 py-1 bg-[#034933] text-[#f5931f] text-[9px] font-black uppercase tracking-widest rounded-full border border-[#f5931f]/20">Pro Version</span>
              </div>
              <h2 className="text-5xl lg:text-7xl font-serif-brand italic text-white leading-[0.9] tracking-tighter">
                Ertrag <span className="text-[#f5931f]">neu</span> <br/> definieren.
              </h2>
              <p className="text-slate-500 mt-6 text-sm leading-relaxed max-w-sm font-medium">
                Hochpräzise Mietwert-Ermittlung durch Echtzeit-Analysen lokaler Marktstrukturen. Entwickelt für anspruchsvolle Bestandsoptimierung.
              </p>
            </div>

            <InputForm isLoading={isLoading} onSubmit={handleStartAnalysis} />
            
            {error && (
              <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-start gap-4 animate-fade-in">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Systemfehler</p>
                  <p className="text-xs text-slate-400 mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Output */}
          <div className="lg:col-span-7 scroll-mt-10" ref={resultsRef}>
             {!result && !isLoading && (
               <div className="h-full min-h-[600px] glass-card rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-16 text-center">
                 <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                    <BarChart size={40} className="text-slate-700" />
                 </div>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Bereit für Recherche</h3>
                 <p className="text-[12px] text-slate-600 max-w-xs leading-relaxed font-medium">
                   Geben Sie links die Objektdaten ein. Die KI startet sofort eine Standort-Recherche inklusive Markt-Grounding.
                 </p>
               </div>
             )}

             {isLoading && (
               <div className="h-full min-h-[600px] glass-card rounded-[3rem] flex flex-col items-center justify-center p-16 text-center border border-white/5">
                 <div className="relative mb-12">
                    <div className="w-32 h-32 border-[6px] border-white/5 border-t-[#f5931f] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="text-[#034933]" size={40} />
                    </div>
                 </div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Deep Scanning...</h3>
                 <div className="flex flex-col items-center gap-3">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                      Sondiere Mietspiegel für {userInput?.address.split(',')[0]}
                    </p>
                    <div className="flex gap-1">
                       <span className="w-1.5 h-1.5 bg-[#f5931f] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-1.5 h-1.5 bg-[#f5931f] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1.5 h-1.5 bg-[#f5931f] rounded-full animate-bounce"></span>
                    </div>
                 </div>
               </div>
             )}

             {result && userInput && (
               <AnalysisResults result={result} input={userInput} />
             )}
          </div>

        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 pt-16 border-t border-white/5 mt-32 opacity-30 hover:opacity-100 transition-opacity">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/5">
               <div className="w-3 h-3 bg-[#f5931f] rounded-sm"></div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              © 2024 B&W Immobilien Management UG
            </p>
          </div>
          <div className="flex gap-10">
            {['Portfolio', 'Expertise', 'Impressum', 'Datenschutz'].map(link => (
              <a key={link} href="#" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-[#f5931f] transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
