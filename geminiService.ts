
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIAnalysis = async (description: string, reason: string): Promise<AIResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise a seguinte manifestação de um jovem aprendiz sobre "${reason}": "${description}". 
      Refine o texto para torná-lo profissional e claro. 
      Forneça também uma análise jurídica baseada na Lei 10.097/2000 (Lei do Aprendiz).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedText: {
              type: Type.STRING,
              description: 'O texto original refinado para ser mais profissional.'
            },
            legalAnalysis: {
              type: Type.STRING,
              description: 'Análise dos direitos e deveres conforme a Lei 10.097/2000.'
            }
          },
          required: ["refinedText", "legalAnalysis"]
        }
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as AIResponse;
  } catch (error) {
    console.error("Erro ao chamar Gemini API:", error);
    // Fallback in case of error
    return {
      refinedText: description,
      legalAnalysis: "Não foi possível realizar a análise jurídica no momento. Por favor, consulte o guia oficial da Lei do Aprendiz (10.097/2000)."
    };
  }
};
