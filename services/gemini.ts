import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";


// 1. Image Compressor (Keep as is)
const compressImage = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 1024;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const base64String = canvas.toDataURL('image/jpeg', 0.6);
        const base64Data = base64String.split(',')[1];

        resolve({
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg', 
          },
        });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
  }

  // MAIN OCR (Keep as is)
  async analyzeExamSheet(files: File[]): Promise<string> {
    try {
      const imageParts = await Promise.all(files.map(compressImage));

      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: {
            parts: [
                ...imageParts,
                { text: "Analyze exam sheets. Extract to JSON schema." },
            ]
        },
        config: {
          systemInstruction: SYSTEM_PROMPT, 
          temperature: 0.0, 
          responseMimeType: "application/json" 
        },
      });
      
      return response.text || ""; 
    } catch (error) {
      console.error("Error analyzing exam sheet:", error);
      throw new Error("Failed to analyze exam sheet. Please try again.");
    }
  }

  // Pollinations Art (Keep as is)
  async generateLineArtPollinations(prompt: string): Promise<string | null> {
    const randomSeed = Math.floor(Math.random() * 1000);
    const enhancedPrompt = encodeURIComponent(
      `${prompt}, simple vector line art, coloring book style, black and white, white background, no shading, minimal details, educational illustration`
    );
    return `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=512&height=512&nologo=true&seed=${randomSeed}&model=flux`;
  }

  async generateLineArt(prompt: string): Promise<string | null> {
    return this.generateLineArtPollinations(prompt);
  }

  

  
}

export const geminiService = new GeminiService();