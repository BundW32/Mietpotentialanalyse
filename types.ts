export enum PropertyType {
  APARTMENT = 'Wohnung',
  HOUSE = 'Haus',
  COMMERCIAL = 'Gewerbe'
}

export enum Condition {
  NEW = 'Neubau',
  MINT = 'Neuwertig',
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
  hasTripleGlazing?: boolean;
  hasBalcony?: boolean;
  hasFloorHeating?: boolean;
  isBarrierFree?: boolean;
  hasModernBathroom?: boolean;
}

// THIS IS THE NEW PART THAT WAS MISSING
export interface LocationZone {
  id: string;
  name: string;
  description: string;
  color: string;
  examples: string[];
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface AnalysisResult {
  estimatedMarketRentPerSqm: number;
  estimatedTotalMarketRent: number;
  locationAnalysis: string;
  confidenceScore: number;
  potentialYearlyGain: number;
  rentGapPercentage: number;
  featureImpacts: Array<{
    feature: string;
    impactPercent: number;
    direction: 'positive' | 'negative';
    description: string;
  }>;
  locationZones?: LocationZone[]; // Linked here
  sources?: GroundingSource[];
  sourceType?: string;
}
