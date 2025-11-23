import { GoogleGenAI } from "@google/genai";
import { MatchStats } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMatchCommentary = async (stats: MatchStats): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Commentary Unavailable (Missing API Key).";

  const prompt = `
    You are an enthusiastic e-sports fighting game commentator (like in Street Fighter or Tekken).
    A match just ended.
    Winner: ${stats.winnerName} with ${stats.winnerHealth}% health remaining.
    Loser: ${stats.loserName}.
    Match Duration: ${stats.duration} seconds.
    
    Give a short, hype, 2-sentence breakdown of the fight. 
    If the winner had high health, call it a domination. 
    If low health, call it a clutch comeback.
    Be funny and energetic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "What a fight!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The connection to the commentator booth was lost!";
  }
};
