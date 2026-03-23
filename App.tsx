import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FileText, Settings, Image as ImageIcon,
  Trash2, GripVertical, Download, Edit3, Eye,
  Building2, Euro, FileSignature,
  AlertTriangle, TrendingUp, ShieldCheck, Home,
  Sparkles, Map as MapIcon, Loader2, Plus, CheckCircle2
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

import { ConceptDocument, UserInputs, SectionId, Measure, RoomVisuals } from './types';
import { generateConcept, extractDataFromNotes } from './services/geminiService';
import { EditableField } from './components/EditableField';
import { RefineButton } from './components/RefineButton';
import { ImageManager } from './components/ImageManager';
import { VisualDocumentation } from './components/VisualDocumentation';
import { PriorityBlockSection } from './components/PriorityBlock';

const initialInputs: UserInputs = {
  property: {
    address: 'Musterstraße 12, 10115 Berlin',
    type: 'Mehrfamilienhaus',
    units: 8,
    livingArea: 650,
    constructionYear: 1932,
    condition: 'Sanierungsbedürftig',
    heating: 'Gas-Zentralheizung',
    energyClass: 'E',
  },
  notes: 'Fassade muss dringend gemacht werden. Treppenhaus ist abgenutzt. Wohnungen 3 und 5 stehen leer und sollen hochwertig saniert werden. Ziel ist eine Mietsteigerung von 2€/m².',
  budget: 150000,
  targetRentIncrease: 1300,
  images:[],
};

const DEFAULT_SECTIONS: string[] =[
  'summary', 'economics', 'costs', 'profitability', 'nextSteps'
];

const getGranularSections = (concept: ConceptDocument | null) => {
  if (!concept) return DEFAULT_SECTIONS;
  
  const sections: string[] = ['summary'];
  
  concept.measures.forEach(m => {
    sections.push(`measure-${m.id}`);
  });['shortTerm', 'mediumTerm', 'longTerm'].forEach(type => {
    sections.push(`priority-${type}`);
  });
  
  sections.push('economics', 'costs', 'profitability');
  
  concept.rooms.forEach((_, idx) => {
    sections.push(`visual-${idx}`);
  });
  
  sections.push('nextSteps');
  
  return sections;
};

interface FooterProps {
  footer: {
    companyName: string;
    address: string;
    manager: string;
    court: string;
    vatId: string;
  };
  isEditMode: boolean;
  onUpdate: (field: string, value: string) => void;
  pageNumber?: number;
  totalPages?: number;
}

const Footer: React.FC<FooterProps> = ({ footer, isEditMode, onUpdate, pageNumber, totalPages }) => {
  const [isFooterEditing, setIsFooterEditing] = useState(false);
  if (!footer) return null;
  
  const effectiveEditMode = isEditMode || isFooterEditing;

  return (
    <div className="footer-legal pdf-footer print:flex flex relative group/footer items-end">
      <div className="absolute -top-8 left-0 flex items-center gap-2 print:hidden opacity-0 group-hover/footer:opacity-100 transition-opacity">
        <button
          onClick={() => setIsFooterEditing(!isFooterEditing)}
          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
            isFooterEditing 
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isFooterEditing ? 'Sperren' : 'Bearbeiten'}
        </button>
        <span className={`text-[9px] font-medium ${isFooterEditing ? 'text-emerald-600' : 'text-gray-400'}`}>
          {isFooterEditing ? 'Bearbeitungsmodus aktiv' : 'Vorschau'}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 flex-1">
        <div className="font-bold text-slate-700 text-[8px]">
          <EditableField 
            value={footer.companyName} 
            onChange={(val) => onUpdate('companyName', val)} 
            isEditMode={effectiveEditMode} 
          />
        </div>
        <div className="text-[7px]">
          <EditableField 
            value={footer.address} 
            onChange={(val) => onUpdate('address', val)} 
            isEditMode={effectiveEditMode} 
          />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 text-center flex-1">
        <div className="text-[7px]">
          <EditableField 
            value={footer.manager} 
            onChange={(val) => onUpdate('manager', val)} 
            isEditMode={effectiveEditMode} 
          />
        </div>
        <div className="text-[7px]">
          <EditableField 
            value={footer.court} 
            onChange={(val) => onUpdate('court', val)} 
            isEditMode={effectiveEditMode} 
          />
        </div>
        <div className="text-[7px]">
          <EditableField 
            value={footer.vatId} 
            onChange={(val) => onUpdate('vatId', val)} 
            isEditMode={effectiveEditMode} 
          />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 text-right flex-1">
        <div className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
          {pageNumber && totalPages ? `Seite ${pageNumber} von ${totalPages}` : ''}
        </div>
      </div>
    </div>
  );
};

interface PageProps {
  children: React.ReactNode;
  footer: any;
  isEditMode: boolean;
  onFooterUpdate: (field: string, value: string) => void;
  className?: string;
  pageNumber?: number;
  totalPages?: number;
}

const Page: React.FC<PageProps> = ({ children, footer, isEditMode, onFooterUpdate, className = "", pageNumber, totalPages }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const[isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        const maxHeight = 1122 - 113; 
        setIsOverflowing(contentRef.current.scrollHeight > maxHeight);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div 
      className={`bg-white shadow-2xl border print:border-none print:shadow-none print:bg-transparent relative flex flex-col transition-colors border-gray-100 pdf-section-container pdf-page ${isEditMode ? 'edit-grid' : ''} ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm', // Changed to minHeight so it can grow
        boxSizing: 'border-box'
      }}
    >
      <div ref={contentRef} className="flex-1 flex flex-col overflow-visible pb-10">
        {children}
      </div>
      
      {isOverflowing && isEditMode && (
        <div className="absolute bottom-[30mm] left-0 right-0 h-px border-t-2 border-dashed border-red-400 z-50 pointer-events-none flex items-center justify-center">
          <span className="bg-red-400 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Text zu lang - Wird in PDF auf Folgeseite verschoben</span>
        </div>
      )}

      <Footer footer={footer} isEditMode={isEditMode} onUpdate={onFooterUpdate} pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  );
};

interface SortableSectionProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
  index: number;
}

const SortableSection: React.FC<SortableSectionProps> = ({
  id,
  children,
  isEditMode,
  index,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group mb-16 mx-auto print:mb-0 print:shadow-none sortable-section transition-all duration-300 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        isEditMode ? 'p-4 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10' : ''
      }`}
    >
      {isEditMode && (
        <div className="absolute -left-28 top-0 flex flex-col items-center gap-2 print:hidden">
          <div 
            {...attributes}
            {...listeners}
            className={`w-16 h-16 rounded-2xl bg-white border shadow-lg flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing border-gray-200 hover:border-emerald-400 hover:shadow-emerald-100`}
          >
            <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
            <span className={`text-[9px] font-black text-slate-700 mt-1`}>{index + 1}</span>
          </div>
          <div className="w-px h-full min-h-[4rem] bg-gradient-to-b from-emerald-200 to-transparent" />
        </div>
      )}

      {!isEditMode && (
        <div className="absolute -left-28 top-0 flex flex-col items-center gap-2 print:hidden">
          <div className={`w-16 h-16 rounded-2xl bg-white border shadow-lg flex flex-col items-center justify-center transition-all border-gray-200`}>
            <span className={`text-[9px] font-bold uppercase tracking-wider text-gray-400`}>Abschnitt</span>
            <span className={`text-xl font-black text-[#334155]`}>{index + 1}</span>
          </div>
          <div className="w-px h-full min-h-[4rem] bg-gradient-to-b from-gray-200 to-transparent" />
        </div>
      )}

      {children}
    </div>
  );
};

export default function App() {
  const[inputs, setInputs] = useState<UserInputs>(() => {
    const saved = localStorage.getItem('bw_inputs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved inputs', e);
      }
    }
    return initialInputs;
  });

  const[concept, setConcept] = useState<ConceptDocument | null>(() => {
    const saved = localStorage.getItem('bw_concept');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          parsed.footer = {
            companyName: 'B & W Immobilien Management UG (haftungsbeschränkt)',
            address: 'Goethestr. 42, 45964 Gladbeck',
            manager: 'Geschäftsführer: Franz-Josef Barth',
            court: 'Amtsgericht Gelsenkirchen, HRB: 19149',
            vatId: 'USt-IdNr.: DE456949310'
          };
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved concept', e);
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('bw_inputs', JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    if (concept) {
      localStorage.setItem('bw_concept', JSON.stringify(concept));
    } else {
      localStorage.removeItem('bw_concept');
    }
  }, [concept]);

  const [isGenerating, setIsGenerating] = useState(false);
  const[generationError, setGenerationError] = useState<string | null>(null);
  const[isExtracting, setIsExtracting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('bw_section_order');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved section order', e);
      }
    }
    return DEFAULT_SECTIONS;
  });

  useEffect(() => {
    if (sectionOrder.length > 0) {
      localStorage.setItem('bw_section_order', JSON.stringify(sectionOrder));
    }
  }, [sectionOrder]);

  useEffect(() => {
    if (concept && sectionOrder.length <= DEFAULT_SECTIONS.length) {
      setSectionOrder(getGranularSections(concept));
    }
  }, [concept]);
  
  const [activeTab, setActiveTab] = useState<'inputs' | 'images' | 'settings'>('inputs');
  const [branding, setBranding] = useState<{ logoUrl: string | null; primaryColor: string }>(() => {
    const saved = localStorage.getItem('bw_branding');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved branding', e);
      }
    }
    return { logoUrl: null, primaryColor: '#059669' };
  });

  useEffect(() => {
    localStorage.setItem('bw_branding', JSON.stringify(branding));
    document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
  }, [branding]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleExtractData = async () => {
    if (!inputs.notes.trim()) return;
    setIsExtracting(true);
    try {
      const extracted = await extractDataFromNotes(inputs.notes);
      setInputs((prev) => ({
        ...prev,
        property: {
          ...prev.property,
          ...extracted,
        },
      }));
    } catch (error) {
      console.error('Extraction failed', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    if (!inputs.property.address || !inputs.notes) {
      setGenerationError('Bitte geben Sie mindestens eine Adresse und Notizen zum Objekt an.');
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);
    try {
      const generated = await generateConcept(inputs);

      if (generated.rooms.length === 0) {
        if (inputs.images.length > 0) {
          generated.rooms =[
            {
              name: 'Allgemeine Dokumentation',
              beforeImages: inputs.images.map((img) => ({
                id: img.id,
                url: img.url,
                caption: img.caption,
              })),
              afterImages: [],
            },
          ];
        } else {
          generated.rooms =[];
        }
      }

      const defaultBlock = (title: string) => ({
        title: title,
        description: '',
        reasoning: '',
        technicalBackground: '',
        economicBenefit: '',
        riskIfNotImplemented: '',
        impactOnRentability: '',
        timeframe: '',
        implementationLogic: ''
      });

      if (typeof generated.buildingPriorities.shortTerm === 'string') {
        const oldPriorities = generated.buildingPriorities as any;
        generated.buildingPriorities = {
          shortTerm: { ...defaultBlock('Kurzfristig'), description: oldPriorities.shortTerm },
          mediumTerm: { ...defaultBlock('Mittelfristig'), description: oldPriorities.mediumTerm },
          longTerm: { ...defaultBlock('Langfristig'), description: oldPriorities.longTerm }
        };
      }

      generated.footer = {
        companyName: 'B & W Immobilien Management UG (haftungsbeschränkt)',
        address: 'Goethestr. 42, 45964 Gladbeck',
        manager: 'Geschäftsführer: Franz-Josef Barth',
        court: 'Amtsgericht Gelsenkirchen, HRB: 19149',
        vatId: 'USt-IdNr.: DE456949310'
      };

      setConcept(generated);
      setSectionOrder(getGranularSections(generated));
      setIsEditMode(true);
    } catch (error) {
      console.error('Error generating concept:', error);
      alert('Fehler bei der Generierung des Konzepts. Bitte überprüfen Sie den API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateConceptField = (path: string, value: any) => {
    if (!concept) return;
    setConcept((prev) => {
      if (!prev) return prev;
      const newConcept: any = { ...prev };
      const keys = path.split('.');
      let current: any = newConcept;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newConcept;
    });
  };

  const renderGranularSection = (id: string, index: number, total: number) => {
    if (!concept) return null;
    const pageNum = index + 2; 
    const totalPages = total + 1;

    if (id.startsWith('measure-')) {
      const measureId = id.replace('measure-', '');
      const measure = concept.measures.find(m => m.id === measureId);
      if (!measure) return null;
      const mIdx = concept.measures.findIndex(m => m.id === measureId);

      return (
        <SortableSection key={id} id={id} isEditMode={isEditMode} index={index}>
          <Page footer={concept.footer} isEditMode={isEditMode} onFooterUpdate={updateFooter} pageNumber={pageNum} totalPages={totalPages}>
            <div className="a4-section-header">
              <div
                className="a4-section-number"
                style={{ backgroundColor: '#f8fafc', color: branding.primaryColor, border: `1px solid #e2e8f0` }}
              >
                M
              </div>
              <div>
                <p className="a4-label">Maßnahme {mIdx + 1}</p>
                <h2 className="a4-title">{measure.trade}</h2>
              </div>
            </div>
            <div className={`measure-card border-2 rounded-2xl p-6 bg-white shadow-md relative group/measure ${measure.isCurrentOffer ? 'border-emerald-200 ring-2 ring-emerald-50' : 'border-slate-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-[#0f172a] mb-2">
                    <EditableField value={measure.description} onChange={(val) => updateMeasure(mIdx, 'description', val)} isEditMode={isEditMode} />
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Bereich: <EditableField value={measure.area} onChange={(val) => updateMeasure(mIdx, 'area', val)} isEditMode={isEditMode} />
                    </span>
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Priorität: <EditableField value={measure.priority} onChange={(val) => updateMeasure(mIdx, 'priority', val)} isEditMode={isEditMode} />
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-600">
                    € <EditableField value={measure.estimatedCost} onChange={(val) => updateMeasure(mIdx, 'estimatedCost', Number(val))} isEditMode={isEditMode} type="number" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Geschätzte Kosten</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Zielsetzung</p>
                  <div className="text-sm text-slate-600 leading-relaxed">
                    <EditableField value={measure.goal} onChange={(val) => updateMeasure(mIdx, 'goal', val)} isEditMode={isEditMode} multiline />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Begründung</p>
                  <div className="text-sm text-slate-600 leading-relaxed">
                    <EditableField value={measure.reason} onChange={(val) => updateMeasure(mIdx, 'reason', val)} isEditMode={isEditMode} multiline />
                  </div>
                </div>
              </div>
            </div>
          </Page>
        </SortableSection>
      );
    }

    if (id.startsWith('priority-')) {
      const type = id.replace('priority-', '') as 'shortTerm' | 'mediumTerm' | 'longTerm';
      const block = concept.buildingPriorities[type];
      const label = type === 'shortTerm' ? 'Kurzfristig' : type === 'mediumTerm' ? 'Mittelfristig' : 'Langfristig';

      return (
        <SortableSection key={id} id={id} isEditMode={isEditMode} index={index}>
          <Page footer={concept.footer} isEditMode={isEditMode} onFooterUpdate={updateFooter} pageNumber={pageNum} totalPages={totalPages}>
            <div className="a4-section-header">
              <div
                className="a4-section-number"
                style={{ backgroundColor: '#f8fafc', color: branding.primaryColor, border: `1px solid #e2e8f0` }}
              >
                P
              </div>
              <div>
                <p className="a4-label">Prioritäten-Fokus</p>
                <h2 className="a4-title">{label}: {block.title}</h2>
              </div>
            </div>
            <PriorityBlockSection
              block={block}
              type={type}
              isEditMode={isEditMode}
              onUpdate={(field, val) => {
                const newPriorities = { ...concept.buildingPriorities };
                newPriorities[type] = { ...newPriorities[type], [field]: val };
                updateConceptField('buildingPriorities', newPriorities);
              }}
              branding={branding}
            />
          </Page>
        </SortableSection>
      );
    }

    if (id.startsWith('visual-')) {
      const roomIdx = parseInt(id.replace('visual-', ''));
      const room = concept.rooms[roomIdx];
      if (!room) return null;

      return (
        <SortableSection key={id} id={id} isEditMode={isEditMode} index={index}>
          <Page footer={concept.footer} isEditMode={isEditMode} onFooterUpdate={updateFooter} pageNumber={pageNum} totalPages={totalPages}>
            <div className="a4-section-header">
              <div
                className="a4-section-number"
                style={{ backgroundColor: '#f8fafc', color: branding.primaryColor, border: `1px solid #e2e8f0` }}
              >
                V
              </div>
              <div>
                <p className="a4-label">Visualisierung</p>
                <h2 className="a4-title">{room.name}</h2>
              </div>
            </div>
            <VisualDocumentation
              rooms={[room]}
              isEditMode={isEditMode}
              onChange={(updatedRooms) => {
                const newRooms =[...concept.rooms];
                newRooms[roomIdx] = updatedRooms[0];
                updateConceptField('rooms', newRooms);
              }}
              showAddButton={false}
            />
          </Page>
        </SortableSection>
      );
    }

    switch (id) {
      case 'summary':
        return (
          <SortableSection key="summary" id="summary" isEditMode={isEditMode} index={index}>
            <Page footer={concept.footer} isEditMode={isEditMode} onFooterUpdate={updateFooter} pageNumber={pageNum} totalPages={totalPages}>
              <div className="a4-section-header">
                <div
                  className="a4-section-number"
                  style={{ backgroundColor: '#f8fafc', color: branding.primaryColor, border: `1px solid #e2e8f0` }}
                >
                  01
                </div>
                <div>
                  <p className="a4-label">Executive Overview</p>
                  <h2 className="a4-title">Management Summary</h2>
                </div>
              </div>
              <div className="a4-card border-2 border-slate-100 p-6 rounded-2xl bg-white shadow-sm">
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  <EditableField
                    value={concept.summary}
                    onChange={(val) => updateConceptField('summary', val)}
                    isEditMode={isEditMode}
                    multiline
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="a4-card-muted p-4 border border-slate-100">
                  <p className="a4-label mb-2">Objektübersicht</p>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <EditableField value={concept.propertyOverview} onChange={(val) => updateConceptField('propertyOverview', val)} isEditMode={isEditMode} multiline />
                  </div>
                </div>
                <div className="a4-card-muted p-4 border border-slate-100">
                  <p className="a4-label mb-2">Ist-Zustand</p>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <EditableField value={concept.asIsAnalysis} onChange={(val) => updateConceptField('asIsAnalysis', val)} isEditMode={isEditMode} multiline />
                  </div>
                </div>
              </div>
            </Page>
          </SortableSection>
        );
      case 'economics':
        return (
          <SortableSection key="economics" id="economics" isEditMode={isEditMode} index={index}>
            <Page footer={concept.footer} isEditMode={isEditMode} onFooterUpdate={updateFooter} pageNumber={pageNum} totalPages={totalPages}>
              <div className="a4-section-header">
                <div
                  className="a4-section-number"
                  style={{ backgroundColor: '#f8fafc', color: branding.primaryColor, border: `1px solid #e2e8f0` }}
                >
                  03
                </div>
                <div>
                  <p className="a4-label">Wirtschaftlichkeit</p>
                  <h2 className="a4-title">Ökonomische Analyse</h2>
                </div>
              </div>
              <div className="space-y-4">
                <div className="a4-card border-2 border-slate-100 p-6">
                  <p className="a4-label mb-2">Cashflow-Optimierung</p>
                  <div className="text-sm text-slate-600 leading-relaxed">
                    <EditableField value={concept.economicAnalysis.cashflow} onChange={(val) => {
                      const newEco = { ...concept.economicAnalysis, cashflow: val };
                      updateConceptField('economicAnalysis', newEco);
                    }} isEditMode={isEditMode} multiline />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="a4-card-muted p-4">
                    <p className="a4-label mb-1">Risikominimierung</p>
                    <div className="text-xs text-slate-600">
                      <EditableField value={concept.economicAnalysis.riskMinimization} onChange={(val) => {
                        const newEco = { ...concept.economicAnalysis, riskMinimization: val };
                        updateConceptField('economicAnalysis', newEco);
                      }} isEditMode={isEditMode} multiline />
                    </div>
                  </div>
                  <div className="a4-card-muted p-4">
                    <p className="a4-label mb-1">Wertsteigerung</p>
                    <div className="text-xs text-slate-600">
                      <EditableField value={concept.economicAnalysis.valueIncrease} onChange={(val) => {
                        const newEco = { ...concept.economicAnalysis, valueIncrease: val };
                        updateConceptField('economicAnalysis', newEco);
                      }} isEditMode={isEditMode} multiline />
                    </div>
                  </div>
                </div>
              </div>
            </Page>
          </SortableSection>
        );
      case 'costs':
        return (
          <SortableSection key="costs" id="costs" isEditMode={isEditMode} index={index}>
            <Page footer={concept.footer} isEditMode={isEditMode} onFooterUpdate={updateFooter} pageNumber={pageNum} totalPages={totalPages}>
              <div className="a4-section-header">
                <div
                  className="a4-section-number"
                  style={{ backgroundColor: '#f8fafc', color: branding.primaryColor, border: `1px solid #e2e8f0` }}
                >
                  04
                </div>
                <div>
                  <p className="a4-label">Investition</p>
                  <h2 className="a4-title">Kostenkalkulation</h2>
                </div>
              </div>
              <div className="a4-card border-2 border-slate-100 p-8 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <p className="a4-label mb-2">Eigenleistung (B&W)</p>
                    <div className="text-3xl font-black text-slate-900">
                      € <EditableField value={concept.costEstimation.internalTotal} onChange={(val) => {
                        const newCosts = { ...concept.costEstimation, internalTotal: Number(val) };
                        updateConceptField('costEstimation', newCosts);
                      }} isEditMode={isEditMode} type="number" />
                    </div>
                  </div>
                  <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <p className="a4-label mb-2">Fremdleistung</p>
                    <div className="text-3xl font-black text-slate-900">
                      € <EditableField value={concept.costEstimation.externalTotal} onChange={(val) => {
                        const newCosts = { ...concept.costEstimation, externalTotal: Number(val) };
                        updateConceptField('costEstimation', newCosts);
                      }} isEditMode={isEditMode} type="number" />
                    </div>
                  </div>
                </div>
                <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-center text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Gesamtinvestition (Netto)</p>
                  <div className="text-5xl font-black">
                    € {(concept.costEstimation.internalTotal + concept.costEstimation.externalTotal).toLocaleString()}
                  </div>
                </div>
              </div>
            </Page>
          </SortableSection>
        );
      case 'profitability':
        return (
          <SortableSection key="profitability" id="profitability" isEditMode={isEditMode} index={index}>
            <Page footer={concept.footer} isEditMode={isEditMode} onFooterUpdate={updateFooter} pageNumber={pageNum} totalPages={totalPages}>
              <div className="a4-section-header">
                <div
                  className="a4-section-number"
                  style={{ backgroundColor: '#f8fafc', color: branding.primaryColor, border: `1px solid #e2e8f0` }}
                >
                  05
                </div>
                <div>
                  <p className="a4-label">Rendite</p>
                  <h2 className="a4-title">Rentabilitäts-Prognose</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="a4-card border-2 border-slate-100 p-6 text-center">
                  <p className="a4-label mb-2">Mietsteigerung p.M.</p>
                  <div className="text-3xl font-black text-emerald-600">
                    € <EditableField value={concept.profitability.expectedRentIncrease} onChange={(val) => {
                      const newProf = { ...concept.profitability, expectedRentIncrease: Number(val) };
                      updateConceptField('profitability', newProf);
                    }} isEditMode={isEditMode} type="number" />
                  </div>
                </div>
                <div className="a4-card border-2 border-slate-100 p-6 text-center">
                  <p className="a4-label mb-2">ROI (Jährlich)</p>
                  <div className="text-3xl font-black text-emerald-600">
                    <EditableField value={concept.profitability.roi} onChange={(val) => {
                      const newProf = { ...concept.profitability, roi: Number(val) };
                      updateConceptField('profitability', newProf);
                    }} isEditMode={isEditMode} type="number" /> %
                  </div>
                </div>
              </div>
              <div className="mt-4 a4-card-muted p-6 text-center border-2 border-slate-100">
                <p className="a4-label mb-2">Amortisationsdauer</p>
                <div className="text-4xl font-black text-slate-900">
                  <EditableField value={concept.profitability.amortizationYears} onChange={(val) => {
                    const newProf = { ...concept.profitability, amortizationYears: Number(val) };
                    updateConceptField('profitability', newProf);
                  }} isEditMode={isEditMode} type="number" /> Jahre
                </div>
              </div>
            </Page>
          </SortableSection>
        );
      case 'nextSteps':
        return (
          <SortableSection key="nextSteps" id="nextSteps" isEditMode={isEditMode} index={index}>
            <Page footer={concept.footer} isEditMode={isEditMode} onFooterUpdate={updateFooter} pageNumber={pageNum} totalPages={totalPages}>
              <div className="a4-section-header">
                <div
                  className="a4-section-number"
                  style={{ backgroundColor: '#f8fafc', color: branding.primaryColor, border: `1px solid #e2e8f0` }}
                >
                  06
                </div>
                <div>
                  <p className="a4-label">Abschluss</p>
                  <h2 className="a4-title">Nächste Schritte</h2>
                </div>
              </div>
              <div className="a4-card border-2 border-slate-900 p-8 bg-slate-900 text-white">
                <div className="text-lg leading-relaxed whitespace-pre-wrap italic opacity-90">
                  <EditableField
                    value={concept.nextSteps}
                    onChange={(val) => updateConceptField('nextSteps', val)}
                    isEditMode={isEditMode}
                    multiline
                  />
                </div>
                <div className="mt-12 pt-8 border-t border-white/20 flex justify-between items-end">
                  <div>
                    <div className="w-48 h-px bg-white/40 mb-2"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Datum / Ort</p>
                  </div>
                  <div className="text-right">
                    <div className="w-48 h-px bg-white/40 mb-2"></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Unterschrift B&W</p>
                  </div>
                </div>
              </div>
            </Page>
          </SortableSection>
        );
      default:
        return null;
    }
  };

  const updateMeasure = (index: number, field: string, value: any) => {
    if (!concept) return;
    const newMeasures =[...concept.measures];
    newMeasures[index] = { ...newMeasures[index], [field]: value };
    updateConceptField('measures', newMeasures);
  };

  const updateFooter = (field: string, value: string) => {
    if (!concept || !concept.footer) return;
    const newFooter = { ...concept.footer, [field]: value };
    updateConceptField('footer', newFooter);
  };

  const [isExporting, setIsExporting] = useState(false);
  const[exportType, setExportType] = useState<'full' | 'angebot' | 'info' | null>(null);
  const [selectedExportType, setSelectedExportType] = useState<'full' | 'angebot' | 'info'>('full');

  const handlePdfExport = async (type: 'full' | 'angebot' | 'info') => {
    if (isExporting) return;
    
    let previousEditMode = isEditMode;
    const originalSectionOrder = [...sectionOrder];
    const originalStates: { el: HTMLElement, disabled: boolean }[] = [];
    const tempStyles: HTMLStyleElement[] =[];
    let element: HTMLElement | null = null;

    try {
      setIsExporting(true);
      setExportType(type);
      setIsEditMode(false);

      if (type === 'angebot') {
        const angebotSections: SectionId[] =['cover', 'measures', 'costs', 'profitability', 'visuals', 'nextSteps'];
        setSectionOrder(originalSectionOrder.filter(id => angebotSections.includes(id)));
      } else if (type === 'info') {
        const infoSections: SectionId[] =['cover', 'summary', 'overview', 'analysis', 'goals', 'priorities', 'economics'];
        setSectionOrder(originalSectionOrder.filter(id => infoSections.includes(id)));
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.scrollTo(0, 0);

      element = document.getElementById('concept-report');
      if (!element) {
        alert('Kein Dokument zum Export gefunden.');
        setSectionOrder(originalSectionOrder);
        setIsEditMode(previousEditMode);
        setIsExporting(false);
        setExportType(null);
        return;
      }

      element.classList.add('pdf-export');
      element.classList.add('pdf-export-mode');

      const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));

      for (const el of styleElements) {
        originalStates.push({ el: el as HTMLElement, disabled: (el as any).disabled });
        
        let cssText = '';
        if (el.tagName.toLowerCase() === 'style') {
          cssText = el.innerHTML;
        } else if (el.tagName.toLowerCase() === 'link') {
          try {
            const href = (el as HTMLLinkElement).href;
            if (href.startsWith(window.location.origin) || href.startsWith('/')) {
              const res = await fetch(href);
              cssText = await res.text();
            }
          } catch (e) {
            console.warn('Could not fetch stylesheet', e);
          }
        }

        if (cssText && (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('color-mix'))) {
          cssText = cssText.replace(/@supports[^{]*color-mix[^{]*\{[^{}]*\{[^{}]*\}[^{}]*\}/g, '');
          const colorFunctions =['oklch', 'oklab', 'color-mix', 'lch', 'lab', 'hwb'];
          colorFunctions.forEach(func => {
            const regex = new RegExp(`${func}\\((?:[^)(]+|\\([^)(]*(?:\\([^)(]*\\)[^)(]*)*\\))*\\)`, 'g');
            cssText = cssText.replace(regex, '#374151');
          });
          
          cssText = cssText.replace(/oklch\(/g, 'rgb(');
          cssText = cssText.replace(/oklab\(/g, 'rgb(');
          cssText = cssText.replace(/color-mix\(/g, 'rgb(');
          
          const tempStyle = document.createElement('style');
          tempStyle.innerHTML = cssText;
          tempStyle.setAttribute('data-pdf-temp', 'true');
          document.head.appendChild(tempStyle);
          tempStyles.push(tempStyle);
          
          (el as any).disabled = true;
        }
      }

      const html2pdfModule: any = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      let typeSuffix = '';
      if (type === 'angebot') typeSuffix = '_Angebot';
      if (type === 'info') typeSuffix = '_Information';

      const filename = `Konzept_${(inputs.property.address || 'objekt')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}${typeSuffix}.pdf`;

      const opt = {
        margin:[0, 0, 0, 0],
        filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: false, // WICHTIGER FIX FÜR DEN ABSTURZ!
          allowTaint: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794, 
          width: 794,
          removeContainer: true,
          onclone: (clonedDoc: Document) => {
            const pages = clonedDoc.querySelectorAll('.pdf-page');

            pages.forEach((page: any) => {
              page.classList.remove('edit-grid');
              
              page.style.width = '210mm';
              // Lässt das Element für html2pdf wachsen anstatt abzuschneiden!
              page.style.minHeight = '297mm';
              page.style.height = 'auto'; 
              page.style.overflow = 'visible';
              page.style.position = 'relative';
              page.style.display = 'flex';
              page.style.flexDirection = 'column';
              page.style.margin = '0';
              page.style.padding = '20mm 25mm 30mm 25mm';
              page.style.boxSizing = 'border-box';

              // Footer so anpassen, dass er ans Ende des mitwachsenden Inhalts rutscht
              const footer = page.querySelector('.pdf-footer, .footer-legal');
              if (footer) {
                footer.style.position = 'relative';
                footer.style.marginTop = 'auto';
                footer.style.bottom = 'auto';
                footer.style.left = '0';
                footer.style.right = '0';
                footer.style.width = '100%';
                footer.style.padding = '6mm 25mm';
                footer.style.background = '#f8fafc';
                footer.style.borderTop = '1px solid #f1f5f9';
                footer.style.boxSizing = 'border-box';
                footer.style.display = 'flex';
                footer.style.justifyContent = 'space-between';
                footer.style.alignItems = 'center';
                footer.style.zIndex = '9999';
                footer.style.height = 'auto';
              }
            });

            const darkBoxes = clonedDoc.querySelectorAll('.dark-box');
            darkBoxes.forEach((box: any) => {
              box.style.display = 'block';
              box.style.color = '#ffffff';
              const textElements = box.querySelectorAll('p, span, li, h1, h2, h3, h4');
              textElements.forEach((el: any) => {
                el.style.color = '#ffffff';
              });
            });
          }
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true,
          precision: 2
        },
        pagebreak: {
          mode:['css', 'legacy', 'avoid-all'],
          before: '.page-break-before-always',
          after: '.page-break-after-always',
          avoid:['.pdf-keep-together', '.dark-box', '.measure-card']
        },
      };

      const pdf = html2pdf().set(opt).from(element);
      await pdf.save();

    } catch (error: any) {
      console.error('PDF Export Fehler:', error);
      alert(`PDF-Export fehlgeschlagen. Bitte Konsole prüfen.`);
    } finally {
      originalStates.forEach(({ el, disabled }) => {
        (el as any).disabled = disabled;
      });
      tempStyles.forEach(style => style.remove());

      if (element) {
        element.classList.remove('pdf-export');
      }
      setSectionOrder(originalSectionOrder);
      setIsEditMode(previousEditMode);
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans text-gray-900">
      <aside className="w-96 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-10 print:hidden">
        <div className="p-6 border-b border-gray-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6" style={{ color: branding.primaryColor }} />
            <h1 className="text-xl font-bold tracking-tight">B&W Management</h1>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Konzept-Generator</p>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'inputs' ? 'border-b-2 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'inputs' ? { borderColor: branding.primaryColor, color: branding.primaryColor } : undefined}
            onClick={() => setActiveTab('inputs')}
          >
            Projektdaten
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'images' ? 'border-b-2 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'images' ? { borderColor: branding.primaryColor, color: branding.primaryColor } : undefined}
            onClick={() => setActiveTab('images')}
          >
            Bilder
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'settings' ? 'border-b-2 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'settings' ? { borderColor: branding.primaryColor, color: branding.primaryColor } : undefined}
            onClick={() => setActiveTab('settings')}
          >
            Branding
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'inputs' && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Home className="w-4 h-4" style={{ color: branding.primaryColor }} />
                  Objektdaten
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={inputs.property.address}
                    onChange={(e) => setInputs({ ...inputs, property: { ...inputs.property, address: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Typ</label>
                    <input
                      type="text"
                      value={inputs.property.type}
                      onChange={(e) => setInputs({ ...inputs, property: { ...inputs.property, type: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Einheiten</label>
                    <input
                      type="number"
                      value={inputs.property.units}
                      onChange={(e) => setInputs({ ...inputs, property: { ...inputs.property, units: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Wohnfläche (m²)</label>
                    <input
                      type="number"
                      value={inputs.property.livingArea}
                      onChange={(e) => setInputs({ ...inputs, property: { ...inputs.property, livingArea: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Baujahr</label>
                    <input
                      type="number"
                      value={inputs.property.constructionYear}
                      onChange={(e) => setInputs({ ...inputs, property: { ...inputs.property, constructionYear: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Zustand</label>
                    <select
                      value={inputs.property.condition || ''}
                      onChange={(e) => setInputs({ ...inputs, property: { ...inputs.property, condition: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="Neuwertig">Neuwertig</option>
                      <option value="Gepflegt">Gepflegt</option>
                      <option value="Renovierungsbedürftig">Renovierungsbedürftig</option>
                      <option value="Sanierungsbedürftig">Sanierungsbedürftig</option>
                      <option value="Abbruchreif">Abbruchreif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Heizungsart</label>
                    <input
                      type="text"
                      value={inputs.property.heating || ''}
                      onChange={(e) => setInputs({ ...inputs, property: { ...inputs.property, heating: e.target.value } })}
                      placeholder="z.B. Gas-Zentralheizung"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Energieeffizienzklasse</label>
                  <select
                    value={inputs.property.energyClass || ''}
                    onChange={(e) => setInputs({ ...inputs, property: { ...inputs.property, energyClass: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                    <option value="H">H</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Euro className="w-4 h-4" style={{ color: branding.primaryColor }} />
                  Wirtschaftliche Ziele
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Budget (€)</label>
                    <input
                      type="number"
                      value={inputs.budget}
                      onChange={(e) => setInputs({ ...inputs, budget: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ziel-Mietsteigerung (€/M)</label>
                    <input
                      type="number"
                      value={inputs.targetRentIncrease}
                      onChange={(e) => setInputs({ ...inputs, targetRentIncrease: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: branding.primaryColor }} />
                    Zustand & Notizen
                  </h3>
                  <button
                    onClick={handleExtractData}
                    disabled={isExtracting || !inputs.notes.trim()}
                    className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-500 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isExtracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Daten extrahieren
                  </button>
                </div>
                <div>
                  <textarea
                    value={inputs.notes}
                    onChange={(e) => setInputs({ ...inputs, notes: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                    placeholder="Beschreiben Sie den Zustand, geplante Maßnahmen, Besonderheiten..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <MapIcon className="w-4 h-4" style={{ color: branding.primaryColor }} />
                  Grundriss (Optional)
                </h3>
                <div className="flex flex-col gap-2">
                  {inputs.property.floorPlanUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 p-2">
                      <img src={inputs.property.floorPlanUrl} alt="Grundriss" className="w-full h-32 object-contain" />
                      <button
                        onClick={() => setInputs({ ...inputs, property: { ...inputs.property, floorPlanUrl: undefined } })}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <MapIcon className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Grundriss hochladen</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setInputs({ ...inputs, property: { ...inputs.property, floorPlanUrl: reader.result as string } });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'images' && (
            <div className="space-y-4">
              <ImageManager
                images={inputs.images}
                onImagesChange={(images) => setInputs({ ...inputs, images })}
              />
              <div className="text-xs text-gray-500 italic mt-4">
                Hinweis: In dieser Demo-Version werden automatisch Platzhalter-Bilder generiert, wenn keine Bilder hochgeladen wurden.
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4" style={{ color: branding.primaryColor }} />
                  Branding
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Firmenlogo</label>
                  {branding.logoUrl ? (
                    <div className="relative w-full h-24 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                      <img src={branding.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" referrerPolicy="no-referrer" />
                      <button
                        onClick={() => setBranding({ ...branding, logoUrl: null })}
                        className="absolute top-1 right-1 p-1.5 bg-white/90 text-red-500 hover:bg-red-50 rounded shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <ImageIcon className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Logo hochladen</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setBranding({ ...branding, logoUrl: event.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Primärfarbe</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-10 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 font-mono">{branding.primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {generationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p>{generationError}</p>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                KI generiert Konzept...
              </>
            ) : (
              <>
                <FileSignature className="w-5 h-5" />
                Konzept erstellen
              </>
            )}
          </button>
          {isGenerating && (
            <p className="mt-3 text-[10px] text-center text-gray-500 italic">
              Die Generierung dauert in der Regel ca. 30-60 Sekunden.
            </p>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-300 p-12 grid-background">
        <div className="max-w-none flex flex-col items-center">
          <div className="w-full max-w-[210mm] flex justify-between items-center mb-12 bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-0 z-20 print:hidden">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-[#0f172a]">Dokument-Editor</h2>
              {concept && (
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setIsEditMode(false)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${!isEditMode ? 'bg-white shadow-sm text-[#0f172a]' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Eye className="w-4 h-4" /> Vorschau
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${isEditMode ? 'bg-white shadow-sm text-[#0f172a]' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Edit3 className="w-4 h-4" /> Bearbeiten
                  </button>
                </div>
              )}
            </div>

            {concept && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedExportType}
                  onChange={(e) => setSelectedExportType(e.target.value as any)}
                  disabled={isExporting}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="full">Gesamtes Konzept</option>
                  <option value="angebot">Angebot (Leerwohnung)</option>
                  <option value="info">Information (Liegenschaft)</option>
                </select>
                <button
                  onClick={() => handlePdfExport(selectedExportType)}
                  disabled={isExporting}
                  className="px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Exportiert...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      PDF Export
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {concept ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 px-4 print:p-0 flex flex-col items-center w-full"
                id="concept-report"
              >
                {/* Cover Page */}
                <div className="relative group mb-16 mx-auto print:mb-0 print:shadow-none pdf-keep-together">
                  <div className="absolute -left-28 top-0 flex flex-col items-center gap-2 print:hidden">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-lg flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seite</span>
                      <span className="text-xl font-black text-slate-700">C</span>
                    </div>
                    <div className="w-px h-16 bg-gradient-to-b from-gray-200 to-transparent" />
                  </div>

                  <div
                    className="cover-page-inner flex flex-col relative page-break-after-always mx-auto bg-white shadow-2xl border border-gray-100 overflow-hidden print:border-none print:shadow-none print:bg-transparent pdf-section-container pdf-cover-page pdf-page"
                    style={{ 
                      borderBottom: `12px solid ${branding.primaryColor}`, 
                      width: '210mm',
                      minHeight: '297mm', // Removed strict height
                      padding: '25mm',
                      boxSizing: 'border-box'
                    }}
                  >
                  <div className="absolute top-16 right-16 text-right">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo" className="h-20 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="text-3xl font-bold tracking-tighter text-[#0f172a]">B & W</div>
                        <div className="text-[10px] tracking-[0.2em] text-slate-500 uppercase font-bold">Immobilien Management UG</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto mb-20 space-y-8">
                    <div className="w-24 h-1.5 mb-12" style={{ backgroundColor: branding.primaryColor }}></div>
                    <div className="space-y-4">
                      <p className="text-sm font-bold uppercase tracking-[0.3em] text-gray-400">Strategisches Immobilienkonzept</p>
                      <h1 className="text-7xl font-serif font-bold text-[#0f172a] leading-[1.1] tracking-tight">
                        <EditableField
                          value={concept.cover.title}
                          onChange={(val) => updateConceptField('cover.title', val)}
                          isEditMode={isEditMode}
                          multiline
                        />
                      </h1>
                    </div>
                    <h2 className="text-3xl text-slate-500 font-light tracking-wide max-w-2xl">
                      <EditableField
                        value={concept.cover.subtitle}
                        onChange={(val) => updateConceptField('cover.subtitle', val)}
                        isEditMode={isEditMode}
                      />
                    </h2>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-12 text-sm border-t border-gray-100 pt-12 pb-16">
                    <div className="space-y-6">
                      <div>
                        <p className="text-gray-400 uppercase tracking-[0.2em] text-[10px] font-bold mb-2">Liegenschaft</p>
                        <p className="text-xl font-bold text-[#0f172a] leading-tight">{inputs.property.address}</p>
                        <p className="text-gray-500 mt-1">
                          {inputs.property.type} • {inputs.property.units} Wohneinheiten
                        </p>
                      </div>
                      {(concept.offerNumber || isEditMode) && (
                        <div>
                          <p className="text-gray-400 uppercase tracking-[0.2em] text-[10px] font-bold mb-2">Angebotsnummer</p>
                          <div className="text-lg font-bold text-slate-900">
                            <EditableField
                              value={concept.offerNumber || ''}
                              onChange={(val) => updateConceptField('offerNumber', val)}
                              isEditMode={isEditMode}
                              placeholder="z.B. BW-2026-001"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-6">
                      <div>
                        <p className="text-gray-400 uppercase tracking-[0.2em] text-[10px] font-bold mb-2">Erstellung & Expertise</p>
                        <div className="text-lg font-bold text-slate-900">
                          <EditableField
                            value={concept.cover.author}
                            onChange={(val) => updateConceptField('cover.author', val)}
                            isEditMode={isEditMode}
                          />
                        </div>
                        <div className="text-gray-500 mt-1">
                          <EditableField
                            value={concept.cover.date}
                            onChange={(val) => updateConceptField('cover.date', val)}
                            isEditMode={isEditMode}
                          />
                        </div>
                      </div>
                      {(concept.offerValidity || isEditMode) && (
                        <div>
                          <p className="text-gray-400 uppercase tracking-[0.2em] text-[10px] font-bold mb-2">Gültigkeit Angebot</p>
                          <div className="text-lg font-bold text-slate-900">
                            <EditableField
                              value={concept.offerValidity || ''}
                              onChange={(val) => updateConceptField('offerValidity', val)}
                              isEditMode={isEditMode}
                              placeholder="z.B. 30 Tage ab Erstellung"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                    <Footer footer={concept.footer} isEditMode={isEditMode} onUpdate={updateFooter} pageNumber={1} totalPages={sectionOrder.length + 1} />
                  </div>
              </div>

                <div className="w-full flex flex-col items-center">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                      {sectionOrder.map((sectionId, index) => renderGranularSection(sectionId, index, sectionOrder.length))}
                    </SortableContext>
                  </DndContext>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium text-gray-500">Noch kein Konzept generiert</p>
                <p className="text-sm">Füllen Sie die Projektdaten aus und klicken Sie auf "Konzept erstellen".</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
