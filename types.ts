
export enum PropertyType {
  APARTMENT = 'Wohnung',
  HOUSE = 'Haus',
  COMMERCIAL = 'Gewerbe'
}

export enum Condition {
  NEW = 'Neubau / Erstbezug',
  MINT = 'Neuwertig',
  MODERNIZED = 'Modernisiert',
  WELL_KEPT = 'Gepflegt',
  NEEDS_RENOVATION = 'Renovierungsbedürftig'
}

export interface UserInput {
  address: string;
  propertyType: PropertyType;
  sizeSqm: number;
  rooms: number;
  yearBuilt: number;
  condition: Condition;
  currentColdRent: number;
  hasTripleGlazing: boolean;
  hasBalcony: boolean;
  hasFloorHeating: boolean;
  isBarrierFree: boolean;
  hasModernBathroom: boolean;
  sanitaryModernizationYear?: number;
  heatingModernizationYear?: number;
  wallInsulationYear?: number;
  isQuietLocation: boolean;
  // Optionale Zusatzmerkmale
  hasGreenSpaceNearby?: boolean;
  hasGoodInfrastructure?: boolean;
}

export interface FeatureImpact {
  feature: string;
  impactPercent: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface LocationZone {
  id: string;
  name: string;
  description: string;
  impactPercent: string;
  color?: string;
  examples?: string[];
}

export interface AnalysisResult {
  estimatedMarketRentPerSqm: number;
  estimatedTotalMarketRent: number;
  mietspiegelMin: number;
  mietspiegelMax: number;
  locationAnalysis: string;
  potentialYearlyGain: number;
  rentGapPercentage: number;
  comparableRentHigh: number;
  comparableRentLow: number;
  sourceType: 'QUALIFIED_MIETSPIEGEL' | 'SIMPLE_MIETSPIEGEL' | 'MARKET_ESTIMATION';
  confidenceScore: number;
  featureImpacts: FeatureImpact[];
  locationZones?: LocationZone[];
}
