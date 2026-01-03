
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, Character } from "../types";

export const generateNextScene = async (
  theme: string,
  history: string[],
  character: Character,
  lastAction: string
): Promise<AIResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are an expert Game Master for an immersive RPG. 
    Current Theme: "${theme}".
    Character: ${character.name}. Stats: Str ${character.stats.strength}, Int ${character.stats.intelligence}, Agi ${character.stats.agility}.
    Inventory: ${character.inventory.join(', ') || 'empty'}.
    
    IMPORTANT LANGUAGE RULE:
    If the user's last action or the theme is in Bengali (বাংলা), you MUST generate the 'sceneDescription' and 'choices[].text' in Bengali. 
    Keep the JSON keys exactly as defined (English).
    
    Scene Guidelines:
    1. Write an evocative, sensory-rich scene description (max 100 words).
    2. Provide 3-4 strategic choices.
    3. Choices should reflect the theme and player stats.
    4. You may return 'healthChange' (e.g., -5, 10), 'inventoryUpdate' (new items to add), or 'statChanges' (e.g., { "strength": 1 }).
    5. Ensure high-quality narrative flow.
  `;

  const prompt = `
    Adventure History: ${history.slice(-10).join(' -> ')}
    Player's Choice: "${lastAction}"
    
    Generate the next high-stakes scene.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sceneDescription: { type: Type.STRING },
          choices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                action: { type: Type.STRING },
              },
              required: ["id", "text", "action"]
            }
          },
          inventoryUpdate: { type: Type.ARRAY, items: { type: Type.STRING } },
          healthChange: { type: Type.NUMBER },
          statChanges: {
            type: Type.OBJECT,
            properties: {
              strength: { type: Type.NUMBER },
              intelligence: { type: Type.NUMBER },
              agility: { type: Type.NUMBER },
            }
          }
        },
        required: ["sceneDescription", "choices"]
      }
    }
  });

  try {
    return JSON.parse(response.text) as AIResponse;
  } catch (e) {
    console.error("Failed to parse AI response", response.text);
    throw new Error("Invalid response format from Game Master.");
  }
};

export const generateSceneImage = async (sceneDescription: string): Promise<string | undefined> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Digital painting, cinematic lighting, epic composition, hyper-detailed: ${sceneDescription}` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.warn("Visual generation skipped or failed.");
  }
  return undefined;
};
