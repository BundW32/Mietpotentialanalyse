import React, { useState } from 'react';
// FIX: Changed '../types' to './types' to prevent crash
import { LocationZone } from './types'; 
import { Map as MapIcon, Info } from 'lucide-react';

interface ZoneExplorerProps {
  zones: LocationZone[];
  mapLink?: string;
  cityName: string;
}

const ZoneExplorer: React.FC<ZoneExplorerProps> = ({ zones, cityName }) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(zones[1]?.id || zones[0]?.id || null);
  const activeZone = zones.find(z => z.id === selectedZone);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase">
            <MapIcon className="text-[#f5931f]" size={14} />
            Mietspiegel-Zonen: {cityName}
          </h3>
        </div>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={`p-2 rounded-lg border transition-all text-center ${
                selectedZone === zone.id 
                  ? 'border-[#f5931f] bg-[#f5931f]/5 ring-2 ring-[#f5931f]/10' 
                  : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color || '#cbd5e1' }}></div>
                <span className="text-[8px] font-black uppercase text-slate-400">Klasse</span>
              </div>
              <h4 className="font-bold text-slate-800 text-[10px] truncate">{zone.name}</h4>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeZone && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 animate-in fade-in duration-300">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-normal">
                  {activeZone.description}
                </p>
              </div>

              {activeZone.examples && activeZone.examples.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
                  {activeZone.examples.map((ex, i) => (
                    <span key={i} className="text-[9px] bg-white text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                      {ex}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoneExplorer; ´
