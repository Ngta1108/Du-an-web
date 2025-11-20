import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../translations";
import { FilterState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImage = async (base64Image: string, language: Language): Promise<{ description: string; suggestions: string[]; filterAdjustments?: Partial<FilterState> }> => {
  try {
    // Remove the data URL prefix if present to get raw base64
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = language === 'vi' 
      ? "Bạn là chuyên gia chỉnh sửa ảnh. Hãy phân tích ảnh này và cung cấp: 1. Mô tả ngắn. 2. Ba gợi ý chỉnh sửa. 3. Một bộ thông số chỉnh sửa cụ thể để làm ảnh đẹp hơn. Các thông số bao gồm: brightness (0-200, chuẩn 100), contrast (0-200, chuẩn 100), saturation (0-200, chuẩn 100), sepia (0-100), vignette (0-100). Hãy trả về JSON."
      : "You are a photo editing expert. Analyze this image and provide: 1. A short description. 2. Three editing suggestions. 3. A specific set of filter adjustments to enhance the image. Parameters: brightness (0-200, default 100), contrast (0-200, default 100), saturation (0-200, default 100), sepia (0-100), vignette (0-100). Return JSON.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png',
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            filterAdjustments: {
              type: Type.OBJECT,
              properties: {
                brightness: { type: Type.NUMBER },
                contrast: { type: Type.NUMBER },
                saturation: { type: Type.NUMBER },
                sepia: { type: Type.NUMBER },
                vignette: { type: Type.NUMBER },
                hue: { type: Type.NUMBER },
              }
            }
          },
          required: ["description", "suggestions"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    const errorDesc = language === 'vi' ? "Không thể phân tích ảnh." : "Could not analyze image.";
    const sugg1 = language === 'vi' ? "Thử điều chỉnh độ sáng thủ công." : "Try adjusting brightness manually.";
    const sugg2 = language === 'vi' ? "Thử thay đổi độ tương phản." : "Experiment with contrast.";
    
    return {
      description: errorDesc,
      suggestions: [sugg1, sugg2]
    };
  }
};