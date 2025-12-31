import React from 'react';
// FIX: Uses ./types
import { AnalysisResult, UserInput } from './types';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, ArrowRight, BarChart3, PlusCircle, MinusCircle } from 'lucide-react';
// FIX: Uses ./ZoneExplorer
import ZoneExplorer from './ZoneExplorer';

interface AnalysisResultsProps {
  result: AnalysisResult;
  input: UserInput;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, input }) => {
  const currentPerSqm = input.currentColdRent / input.sizeSqm;
  const targetPerSqm = result.estimatedMarketRentPerSqm;

  const chartData = [
    { name: 'IST', price: currentPerSqm, color: '#334155' },
    { name: 'MARKT', price: targetPerSqm, color: '#f5931f' }
  ];

  const formatCurrency = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  const formatSqm = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val) + '/m²';

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Aktuell (Ist)</p>
          <p className="text-xl font-black text-white">{formatCurrency(input.currentColdRent)}</p>
          <p className="text-[9px] text-slate-500 font-bold">{formatSqm(currentPerSqm)}</p>
        </div>
        
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Markt-Potenzial</p>
          <p className="text-xl font-black text-[#f5931f]">{formatCurrency(result.estimatedTotalMarketRent)}</p>
          <p className="text-[9px] text-[#f5931f]/80 font-bold">{formatSqm(targetPerSqm)}</p>
        </div>

        <div className="bg-[#f5931f] p-4 rounded-xl shadow-[0_0_15px_rgba(245,147,31,0.3)] text-white">
          <p className="text-[8px] text-white/80 font-black uppercase mb-1">Mehrertrag p.a.</p>
          <p className="text-xl font-black">+{formatCurrency(result.potentialYearlyGain)}</p>
          <div className="flex items-center gap-1 mt-0.5">
             <TrendingUp size={10} className="text-white" />
             <span className="text-[9px] text-white font-black">+{result.rentGapPercentage.toFixed(0)}% Steigerung</span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Daten-Qualität</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-black text-white">{result.confidenceScore}%</p>
            <div className="h-1.5 flex-1 bg-slate-800 rounded-full mb-2 overflow-hidden">
               <div className="h-full bg-green-500" style={{width: `${result.confidenceScore}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      {result.locationZones && (
        <ZoneExplorer 
          zones={result.locationZones} 
          cityName={input.address.split(',').pop()?.trim() || 'Objektort'} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
           <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
               <BarChart3 size={14} className="text-[#f5931f]" />
               <h3 className="text-[9px] font-black text-white uppercase tracking-widest">Marktvergleich (€/m²)</h3>
             </div>
             <div className="p-4 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} width={35} />
                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff'}} />
                    <Bar dataKey="price" barSize={40} radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
             </div>
           </div>

           <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Einflussfaktoren</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.featureImpacts.map((feat, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${feat.direction === 'positive' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {feat.direction === 'positive' ? <PlusCircle size={12} /> : <MinusCircle size={12} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{feat.feature} <span className="text-slate-500 text-[10px]">({feat.impactPercent}%)</span></p>
                      <p className="text-[10px] text-slate-400 leading-tight">{feat.description}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-5">
           <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
              <div>
                <p className="text-[8px] text-[#f5931f] font-black uppercase tracking-widest mb-3">Fazit der KI</p>
                <p className="text-sm font-serif italic leading-relaxed text-slate-300">"{result.locationAnalysis}"</p>
              </div>
              <button className="mt-6 w-full py-3 bg-white text-slate-900 rounded-xl font-black text-xs hover:bg-[#f5931f] hover:text-white transition-all flex items-center justify-center gap-2">
                Experten-Gespräch anfordern <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
