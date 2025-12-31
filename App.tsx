import React, { useState, useRef, useEffect } from 'react';
import InputForm from './InputForm';
import AnalysisResults from './AnalysisResults';
import { UserInput, AnalysisResult } from './types';
import { analyzePotential } from './geminiService';
import { AlertCircle, Key } from 'lucide-react';

// FIX: Named Export "export const App"
export const App: React.FC = () => {
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Starte Analyse...");
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  // WordPress Resize Integration
  useEffect(() => {
    const sendHeight = () => {
      if (appRef.current) {
        window.parent.postMessage({ type: 'setHeight', height: appRef.current.scrollHeight }, '*');
      }
    };
    sendHeight();
    window.addEventListener('resize', sendHeight);
    const observer = new ResizeObserver(sendHeight);
    if (appRef.current) observer.observe(appRef.current);
    return () => {
      window.removeEventListener('resize', sendHeight);
      observer.disconnect();
    };
  }, [result, userInput, error, isLoading, progress]);

  const simulateProgress = () => {
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev; 
        const newProgress = prev + Math.max(0.2, Math.random() * ((95 - prev) / 15));
        if (newProgress < 25) setLoadingText("Initialisiere KI-Modell...");
        else if (newProgress < 50) setLoadingText("Analysiere Makro-Lage...");
        else if (newProgress < 75) setLoadingText("Vergleiche Mietpreise...");
        else setLoadingText("Berechne Mietpotenzial...");
        return newProgress;
      });
    }, 150);
    return () => clearInterval(timer);
  };

  const handleAnalysis = async (data: UserInput) => {
    setIsLoading(true);
    setError(null);
    setUserInput(data);
    setResult(null);
    const stopTimer = simulateProgress();

    try {
      const analysis = await analyzePotential(data);
      stopTimer();
      setProgress(100);
      setLoadingText("Fertig!");
      setTimeout(() => {
        setResult(analysis);
        setIsLoading(false);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }, 600);
    } catch (err: any) {
      stopTimer();
      console.error(err);
      setError(err.message || "Ein Fehler ist aufgetreten.");
      setIsLoading(false);
    }
  };

  return (
    <div ref={appRef} className="w-full bg-slate-950 text-slate-100 font-sans overflow-hidden min-h-[600px]">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex items-center gap-4">
           <div className="h-10 w-10 bg-[#f5931f] rounded-full"></div>
           <h1 className="text-2xl font-black text-white">B & W <span className="text-[10px] block text-slate-400 font-normal">Immobilien Management</span></h1>
        </div>

        {/* Loading / Form / Error / Results */}
        {isLoading ? (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-12 text-center">
            <div className="text-xl font-bold text-white mb-4">{Math.round(progress)}% - {loadingText}</div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-[#f5931f]" style={{ width: `${progress}%` }}></div></div>
          </div>
        ) : (
          <section className="animate-in fade-in"><InputForm isLoading={isLoading} onSubmit={handleAnalysis} /></section>
        )}
        
        {error && <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl text-red-200">{error}</div>}
        
        <div ref={resultsRef}>{result && userInput && !isLoading && <AnalysisResults result={result} input={userInput} />}</div>
      </div>
    </div>
  );
};
