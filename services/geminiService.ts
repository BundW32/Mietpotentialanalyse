import { GoogleGenAI, Type } from "@google/genai";
// FIX: Uses ./types
import { UserInput, AnalysisResult, GroundingSource } from "./types";

export const analyzePotential = async (input: UserInput): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
  
  const prompt = `
    DU BIST EIN IMMOBILIEN-EXPERTE FÜR DEN DEUTSCHEN MARKT.
    Analysiere das Miet-Potential für:
    ADRESSE: ${input.address}
    DETAILS: ${input.sizeSqm}m², ${input.rooms} Zimmer, Baujahr ${input.yearBuilt}, Zustand: ${input.condition}.
    AUSSTATTUNG: Balkon: ${input.hasBalcony}, Fußbodenheizung: ${input.hasFloorHeating}, Barrierefrei: ${input.isBarrierFree}.

    AUFGABE:
    1. Nutze die Google-Suche, um aktuelle Vergleichsmieten (Immoscout24, Mietspiegel der Stadt, lokale Portale) für genau diesen Standort zu finden.
    2. Berechne die geschätzte Marktmiete pro m².
    3. Erkläre kurz die Lagequalität.
    4. Erstelle 3 typische Standort-Zonen (z.B. Einfache Lage, Mittlere Lage, Gute Lage) mit Kurzbeschreibung und Beispielen.

    ANTWORTE IM GEWÜNSCHTEN JSON-FORMAT.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedMarketRentPerSqm: { type: Type.NUMBER },
            locationAnalysis: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            estimatedTotalMarketRent: { type: Type.NUMBER },
            potentialYearlyGain: { type: Type.NUMBER },
            rentGapPercentage: { type: Type.NUMBER },
            featureImpacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  feature: { type: Type.STRING },
                  impactPercent: { type: Type.NUMBER },
                  direction: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["feature", "impactPercent", "direction", "description"]
              }
            },
            locationZones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  color: { type: Type.STRING },
                  examples: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "name", "description"]
              }
            }
          }
        }
      }
    });

    const rawJson = JSON.parse(response.text || "{}");
    const marketRentTotal = rawJson.estimatedMarketRentPerSqm * input.sizeSqm;
    const gain = Math.max(0, marketRentTotal - input.currentColdRent);

    return {
      ...rawJson,
      estimatedTotalMarketRent: marketRentTotal,
      potentialYearlyGain: gain * 12,
      rentGapPercentage: input.currentColdRent > 0 ? ((marketRentTotal - input.currentColdRent) / input.currentColdRent) * 100 : 0,
      sources: [], 
      sourceType: 'AI_ESTIMATION'
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
