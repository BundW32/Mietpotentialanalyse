import React, { useState, useEffect } from 'react';
// FIX: Uses ./types (Single dot)
import { PropertyType, Condition, UserInput } from './types';
import { MapPin, Ruler, Building, Coins, Sparkles, Loader2, ChevronRight, CalendarDays, Home } from 'lucide-react';

interface Props {
  isLoading: boolean;
  onSubmit: (data: UserInput) => void;
}

const InputForm: React.FC<Props> = ({ isLoading, onSubmit }) => {
  const [formData, setFormData] = useState<UserInput>({
    address: '',
    propertyType: PropertyType.APARTMENT,
    sizeSqm: 75,
    rooms: 3,
    yearBuilt: 1990,
    condition: Condition.WELL_KEPT,
    currentColdRent: 700,
    hasTripleGlazing: false,
    hasBalcony: true,
    hasFloorHeating: false,
    isBarrierFree: false,
    hasModernBathroom: true
  });

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (formData.address.length < 5) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(formData.address)}&limit=5&lang=de`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) { console.error(e); }
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl shadow-xl border border-slate-800 overflow-hidden backdrop-blur-sm">
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800">
        <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
          <Building size={16} className="text-[#f5931f]" />
          Objekt-Eckdaten
        </h2>
        {isLoading && (
          <div className="text-[10px] text-[#f5931f] flex items-center gap-2 font-bold bg-[#f5931f]/10 px-3 py-1 rounded-full border border-[#f5931f]/20">
            <Loader2 className="animate-spin" size={12} />
            KI RECHERCHIERT...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        <div className="relative z-20">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Standort (Adresse)</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 text-[#f5931f]" size={18} />
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => {
                handleChange('address', e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              required
              className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-1 focus:ring-[#f5931f] focus:border-[#f5931f] transition-all text-white placeholder:text-slate-600"
              placeholder="Straße, Hausnummer, PLZ, Ort"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const p = s.properties;
                    const fullAddr = `${p.street || ''} ${p.housenumber || ''}, ${p.postcode || ''} ${p.city || ''}`.trim();
                    handleChange('address', fullAddr);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 text-sm text-slate-300 border-b border-slate-800 last:border-0 transition-colors"
                >
                  <span className="font-bold text-white">{s.properties.street} {s.properties.housenumber}</span>, {s.properties.city}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Fläche (m²)</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-3 text-slate-500" size={14} />
              <input 
                type="number" 
                value={formData.sizeSqm}
                onChange={(e) => handleChange('sizeSqm', Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:border-[#f5931f] text-sm text-white" 
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Baujahr</label>
            <div className="relative">
               <CalendarDays className="absolute left-3 top-3 text-slate-500" size={14} />
               <input 
               type="number" 
               value={formData.yearBuilt}
               onChange={(e) => handleChange('yearBuilt', Number(e.target.value))}
               className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:border-[#f5931f] text-sm text-white" 
               />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Ist-Miete (€)</label>
            <div className="relative">
              <Coins className="absolute left-3 top-3 text-slate-500" size={14} />
              <input 
                type="number" 
                value={formData.currentColdRent}
                onChange={(e) => handleChange('currentColdRent', Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:border-[#f5931f] text-sm text-white" 
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Zimmer</label>
            <div className="relative">
               <Home className="absolute left-3 top-3 text-slate-500" size={14} />
               <input 
               type="number" 
               value={formData.rooms}
               onChange={(e) => handleChange('rooms', Number(e.target.value))}
               className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:border-[#f5931f] text-sm text-white" 
               />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { id: 'hasBalcony', label: 'Balkon' },
            { id: 'hasFloorHeating', label: 'Fußbodenhzg.' },
            { id: 'isBarrierFree', label: 'Barrierefrei' },
            { id: 'hasTripleGlazing', label: '3-fach Glas' }
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-[#f5931f] transition-all group">
              <input 
                type="checkbox" 
                checked={(formData as any)[opt.id]}
                onChange={(e) => handleChange(opt.id, e.target.checked)}
                className="w-4 h-4 accent-[#f5931f] bg-slate-900 border-slate-700 rounded"
              />
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-white uppercase transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || !formData.address}
          className="w-full py-4 bg-[#f5931f] text-white font-black rounded-xl shadow-[0_0_20px_rgba(245,147,31,0.2)] hover:bg-[#ffaa40] hover:shadow-[0_0_30px_rgba(245,147,31,0.4)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm transform hover:-translate-y-0.5"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
          Potential jetzt analysieren
          <ChevronRight size={18} />
        </button>
      </form>
    </div>
  );
};

export default InputForm;
