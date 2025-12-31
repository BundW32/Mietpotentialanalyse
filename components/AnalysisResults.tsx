
import React from 'react';
import { AnalysisResult, UserInput } from '../types';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, ArrowRight, BarChart3, PlusCircle, MinusCircle } from 'lucide-react';
import ZoneExplorer from './ZoneExplorer';

interface AnalysisResultsProps {
  result: AnalysisResult;
  input: UserInput;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, input }) => {
  const currentPerSqm = input.currentColdRent / input.sizeSqm;
  const targetPerSqm = result.estimatedMarketRentPerSqm;

  const chartData = [
    { name: 'IST', price: currentPerSqm, color: '#1e293b' },
    { name: 'MARKT', price: targetPerSqm, color: '#f5931f' }
  ];

  const formatCurrency = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  const formatSqm = (val: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val) + '/m²';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Metrics Row - More Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Status</p>
          <p className="text-xl font-black text-slate-800">{formatCurrency(input.currentColdRent)}</p>
          <p className="text-[9px] text-slate-500 font-bold">{formatSqm(currentPerSqm)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Zielwert</p>
          <p className="text-xl font-black text-slate-900">{formatCurrency(result.estimatedTotalMarketRent)}</p>
          <p className="text-[9px] text-[#f5931f] font-black">{formatSqm(targetPerSqm)}</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl shadow-xl text-white">
          <p className="text-[8px] text-[#f5931f] font-black uppercase mb-1">Ertrag p.a.</p>
          <p className="text-xl font-black">+{formatCurrency(result.potentialYearlyGain)}</p>
          <div className="flex items-center gap-1 mt-0.5">
             <TrendingUp size={10} className="text-green-400" />
             <span className="text-[9px] text-green-400 font-black">+{result.rentGapPercentage.toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Sicherheit</p>
          <p className="text-xl font-black text-slate-800">{result.confidenceScore}%</p>
          <p className="text-[9px] text-slate-500 font-bold">Präzision</p>
        </div>
      </div>

      {result.locationZones && (
        <ZoneExplorer 
          zones={result.locationZones} 
          cityName={input.address.split(',').pop()?.trim() || 'Objektort'} 
        />
      )}

      {/* Main Analysis Block - More Tightly Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
           <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
               <BarChart3 size={14} className="text-[#f5931f]" />
               <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Marktvergleich</h3>
             </div>
             <div className="p-4 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} width={35} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="price" barSize={40} radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
             </div>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
               Einflussfaktoren
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.featureImpacts.map((feat, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${
                      feat.direction === 'positive' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {feat.direction === 'positive' ? <PlusCircle size={12} /> : <MinusCircle size={12} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{feat.feature} ({feat.impactPercent}%)</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{feat.description}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-5">
           <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl h-full flex flex-col justify-between">
              <div>
                <p className="text-[8px] text-[#f5931f] font-black uppercase tracking-widest mb-3">Fazit</p>
                <p className="text-md font-serif italic leading-relaxed">"{result.locationAnalysis}"</p>
              </div>
              <button className="mt-6 w-full py-3 bg-white text-slate-900 rounded-xl font-black text-xs hover:bg-[#f5931f] hover:text-white transition-all flex items-center justify-center gap-2">
                Kontakt Experten-Team <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
