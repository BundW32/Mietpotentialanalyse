
import { GoogleGenAI } from "@google/genai";
import { UserInput, AnalysisResult, LocationZone } from "../types";

/**
 * Hilfsfunktion zur robusten Extraktion von JSON aus einem String.
 */
function extractJSON(text: string): any {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      console.error("Kein JSON im Output gefunden. Rohtext:", text);
      throw new Error("Die KI hat kein gültiges Ergebnis-Format geliefert.");
    }
    
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Parsing-Fehler:", e, "Text:", text);
    throw new Error("Die Datenanalyse konnte nicht in ein lesbares Format umgewandelt werden.");
  }
}

export const analyzePotential = async (input: UserInput): Promise<AnalysisResult> => {
  const modelName = 'gemini-3-pro-preview';
  
  // Sicherer Zugriff auf API_KEY
  const apiKey = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
  
  if (!apiKey) {
    throw new Error("API_KEY ist nicht konfiguriert. Bitte wählen Sie einen Key über das Interface aus.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    DU BIST EIN IMMOBILIEN-EXPERTE FÜR DEN DEUTSCHEN MARKT.
    Analysiere das Miet-Potential für folgende Immobilie:
    ADRESSE: ${input.address}
    OBJEKT-DETAILS: ${input.sizeSqm}m², ${input.rooms} Zimmer, Baujahr ${input.yearBuilt}, Zustand: ${input.condition}.
    ZUSATZ: Balkon: ${input.hasBalcony}, 3-fach Glas: ${input.hasTripleGlazing}, Fußbodenheizung: ${input.hasFloorHeating}.

    AUFGABE:
    1. Nutze Google Search für eine präzise Marktanalyse, nenne aber im Ergebnis KEINE URLs oder Quellen-Links.
    2. Berechne eine realistische Marktmiete pro m² basierend auf Lage und Modernisierungsgrad.
    3. Definiere 3 lokale Lagezonen für diesen Standort.

    ANTWORTE AUSSCHLIESSLICH ALS JSON-OBJEKT:
    {
      "estimatedMarketRentPerSqm": zahl,
      "estimatedTotalMarketRent": zahl,
      "comparableRentLow": zahl,
      "comparableRentHigh": zahl,
      "locationAnalysis": "string",
      "sourceType": "QUALIFIED_MIETSPIEGEL" | "SIMPLE_MIETSPIEGEL" | "MARKET_ESTIMATION",
      "confidenceScore": zahl (0-100),
      "featureImpacts": [
        { "feature": "string", "impactPercent": zahl, "direction": "positive" | "negative", "description": "string" }
      ],
      "locationZones": [
        { "id": "string", "name": "string", "description": "string", "impactPercent": "string", "color": "string", "examples": ["string"] }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const responseText = response.text || "";
    const data = extractJSON(responseText);
    
    const currentRent = Number(input.currentColdRent) || 0;
    const targetRent = Number(data.estimatedTotalMarketRent) || (Number(data.estimatedMarketRentPerSqm) * input.sizeSqm);

    const zones: LocationZone[] = (data.locationZones || []).map((z: any, i: number) => ({
      id: z.id || `zone-${i}`,
      name: z.name || 'Unbekannte Zone',
      description: z.description || 'Informationen zur Lage folgen.',
      impactPercent: z.impactPercent || '0%',
      color: z.color || '#94a3b8',
      examples: z.examples || []
    }));

    return {
      ...data,
      locationZones: zones,
      estimatedMarketRentPerSqm: Number(data.estimatedMarketRentPerSqm),
      estimatedTotalMarketRent: targetRent,
      mietspiegelMin: (Number(data.comparableRentLow) || Number(data.estimatedMarketRentPerSqm) * 0.9) * input.sizeSqm,
      mietspiegelMax: (Number(data.comparableRentHigh) || Number(data.estimatedMarketRentPerSqm) * 1.1) * input.sizeSqm,
      potentialYearlyGain: Math.max(0, targetRent - currentRent) * 12,
      rentGapPercentage: currentRent > 0 ? ((targetRent - currentRent) / currentRent) * 100 : 0
    };
  } catch (e: any) {
    console.error("Fehler in analyzePotential:", e);
    if (e.message?.includes("500")) {
      throw new Error("Server-Überlastung bei Google. Bitte versuchen Sie es in wenigen Sekunden erneut.");
    }
    throw e;
  }
};
