
import React, { useState, useEffect, useRef } from 'react';
import { PropertyType, Condition, UserInput } from '../types';
import { 
  Calculator, MapPin, Ruler, Home, Coins, ChevronDown, ChevronUp, 
  Sparkles, Wind, ShieldCheck, Thermometer, Loader2, Hammer, Search,
  Globe, FileSearch, BarChart3, CheckCircle2, Building2, Navigation
} from 'lucide-react';

interface InputFormProps {
  isLoading: boolean;
  onSubmit: (data: UserInput) => void;
}

interface AddressSuggestion {
  label: string;
  city?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
}

const ANALYSIS_STEPS = [
  { id: 0, label: "Stadt & Region...", icon: Globe },
  { id: 1, label: "Mietspiegel-Daten...", icon: FileSearch },
  { id: 2, label: "Bodenrichtwerte...", icon: MapPin },
  { id: 3, label: "BGB-Faktoren...", icon: Hammer },
  { id: 4, label: "Marktspannbreite...", icon: BarChart3 },
  { id: 5, label: "KI-Gutachten...", icon: CheckCircle2 }
];

const InputForm: React.FC<InputFormProps> = ({ isLoading, onSubmit }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<any>({
    address: '',
    propertyType: PropertyType.APARTMENT,
    sizeSqm: 70,
    rooms: 3,
    yearBuilt: 1985,
    condition: Condition.WELL_KEPT,
    currentColdRent: 600,
    hasTripleGlazing: false,
    hasBalcony: false,
    hasFloorHeating: false,
    isBarrierFree: false,
    hasModernBathroom: true,
    sanitaryModernizationYear: '',
    heatingModernizationYear: '',
    wallInsulationYear: '',
    isQuietLocation: true
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (formData.address.length < 4) {
        setSuggestions([]);
        return;
      }

      setIsSearchingAddress(true);
      try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(formData.address)}&limit=5&lang=de`);
        const data = await response.json();
        
        const formatted: AddressSuggestion[] = data.features.map((f: any) => {
          const p = f.properties;
          const parts = [p.street, p.housenumber, p.postcode, p.city].filter(Boolean);
          return {
            label: parts.join(', '),
            city: p.city,
            street: p.street,
            housenumber: p.housenumber,
            postcode: p.postcode
          };
        });
        
        setSuggestions(formatted);
        setShowSuggestions(formatted.length > 0);
      } catch (error) {
        console.error("Adress-Suche fehlgeschlagen", error);
      } finally {
        setIsSearchingAddress(false);
      }
    };

    const timeoutId = setTimeout(fetchAddresses, 400);
    return () => clearTimeout(timeoutId);
  }, [formData.address]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      setProgress(0);
      
      interval = setInterval(() => {
        setLoadingStep(prev => {
          const next = prev + 1;
          if (next < ANALYSIS_STEPS.length) {
            setProgress((next / (ANALYSIS_STEPS.length - 1)) * 100);
            return next;
          }
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSelectSuggestion = (s: AddressSuggestion) => {
    setFormData(prev => ({ ...prev, address: s.label }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      sizeSqm: Number(formData.sizeSqm),
      rooms: Number(formData.rooms),
      yearBuilt: Number(formData.yearBuilt),
      currentColdRent: Number(formData.currentColdRent)
    });
  };

  return (
    <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden">
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Search className="text-[#f5931f]" size={16} />
            Objekt-Analyse
          </h2>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 px-2 py-0.5 bg-[#f5931f]/10 border border-[#f5931f]/20 rounded text-[9px] font-black text-[#f5931f] uppercase tracking-tighter">
            <Loader2 className="animate-spin" size={10} />
            KI aktiv
          </div>
        )}
      </div>
      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 text-center">
            <div className="max-w-xs w-full space-y-4">
              <div className="bg-slate-800 p-4 rounded-full border border-slate-700 inline-block">
                {React.createElement(ANALYSIS_STEPS[loadingStep].icon, {
                  className: "w-8 h-8 text-[#f5931f] animate-pulse",
                  strokeWidth: 1.5
                })}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                  {ANALYSIS_STEPS[loadingStep].label}
                </h3>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#f5931f] transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`p-6 space-y-6 ${isLoading ? 'blur-sm' : ''}`}>
          <div className="space-y-2 relative" ref={suggestionRef}>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Standort</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[#f5931f]" />
              <input 
                type="text" 
                name="address" 
                autoComplete="off"
                value={formData.address} 
                onChange={handleChange} 
                required 
                placeholder="Straße, Hausnummer, Ort"
                className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-[#f5931f]" 
              />
              {isSearchingAddress && <Loader2 size={12} className="absolute right-3 top-4 text-slate-500 animate-spin" />}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-[60] left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
                {suggestions.map((s, idx) => (
                  <li key={idx}>
                    <button type="button" onClick={() => handleSelectSuggestion(s)} className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2 border-b border-slate-700/50 last:border-0">
                      <Navigation size={12} className="text-[#f5931f]" />
                      <span className="text-xs text-white truncate">{s.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-500 uppercase">Fläche (m²)</label>
              <div className="relative">
                <Ruler className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                <input type="number" name="sizeSqm" value={formData.sizeSqm} onChange={handleChange} className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-1 focus:ring-[#f5931f]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-500 uppercase">Baujahr</label>
              <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-1 focus:ring-[#f5931f]" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-500 uppercase">Ist-Miete (€)</label>
              <div className="relative">
                <Coins className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                <input type="number" name="currentColdRent" value={formData.currentColdRent} onChange={handleChange} className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-1 focus:ring-[#f5931f]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-500 uppercase">Zimmer</label>
              <input type="number" name="rooms" value={formData.rooms} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-1 focus:ring-[#f5931f]" />
            </div>
          </div>

          <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 space-y-4">
             <div className="flex items-center gap-2 text-[#f5931f]">
               <Hammer size={14} />
               <span className="text-[9px] font-black uppercase tracking-widest">Modernisierung</span>
             </div>
             <div className="grid grid-cols-3 gap-3">
                {['sanitaryModernizationYear', 'heatingModernizationYear', 'wallInsulationYear'].map((key, i) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase truncate">
                      {i === 0 ? 'Bad' : i === 1 ? 'Heizung' : 'Dämmung'}
                    </label>
                    <input type="number" name={key} value={formData[key]} onChange={handleChange} placeholder="Jahr" className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-[10px] outline-none" />
                  </div>
                ))}
             </div>
          </div>

          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/20 rounded-lg border border-slate-700 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <span>Zusatzmerkmale</span>
            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-in fade-in">
              {[
                { name: 'hasTripleGlazing', label: '3-fach Glas' },
                { name: 'hasFloorHeating', label: 'Fußboden' },
                { name: 'hasBalcony', label: 'Balkon' },
                { name: 'isBarrierFree', label: 'Barrierefrei' },
              ].map(item => (
                <label key={item.name} className="flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-700 rounded cursor-pointer">
                  <input type="checkbox" name={item.name} checked={formData[item.name]} onChange={handleChange} className="w-3 h-3 accent-[#f5931f]" />
                  <span className="text-[9px] font-bold text-slate-300 uppercase truncate">{item.label}</span>
                </label>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !formData.address}
            className={`w-full py-4 text-white font-black rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${
              isLoading ? 'bg-slate-700 cursor-not-allowed' : 'bg-[#f5931f] hover:bg-[#d9821a]'
            }`}
          >
            Analyse starten
            <Sparkles size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default InputForm;
