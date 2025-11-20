
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../translations";
import { FilterState, DetectedObject, SocialContent } from "../types";

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

export const generateImagePrompt = async (base64Image: string, language: Language): Promise<string> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const prompt = language === 'vi'
      ? "Hãy đóng vai một chuyên gia Prompt Engineering cho AI Art (Midjourney/Stable Diffusion). Hãy nhìn bức ảnh này và viết ra một text prompt thật chi tiết bằng tiếng Anh để tái tạo lại bức ảnh này. Bao gồm chi tiết về chủ thể, ánh sáng, phong cách nghệ thuật, góc máy, và vibe. Chỉ trả về nội dung prompt."
      : "Act as an expert AI Art Prompt Engineer (Midjourney/Stable Diffusion). Analyze this image and write a detailed text prompt in English to recreate this image. Include details about subject, lighting, art style, camera angle, and vibe. Return only the prompt text.";

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
    });

    return response.text || "Failed to generate prompt.";
  } catch (error) {
    console.error("Prompt generation failed:", error);
    return "Error generating prompt.";
  }
};

export const detectObjects = async (base64Image: string): Promise<DetectedObject[]> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const prompt = "Detect the main objects in this image. Return a JSON list where each item has a 'label' (string) and 'box_2d' (array of 4 integers [ymin, xmin, ymax, xmax] normalized to 0-1000).";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/png' } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    box_2d: { 
                        type: Type.ARRAY, 
                        items: { type: Type.INTEGER }
                    }
                },
                required: ["label", "box_2d"]
            }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Object detection failed:", error);
    return [];
  }
};

export const generateSocialCaption = async (base64Image: string, language: Language): Promise<SocialContent> => {
    try {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        
        const prompt = language === 'vi'
            ? "Hãy nhìn bức ảnh này và viết 3 dòng trạng thái (caption) cho mạng xã hội (Facebook/Instagram): 1 cái hài hước, 1 cái sâu sắc (deep), và 1 cái tối giản. Kèm theo danh sách 10 hashtag phù hợp. Trả về JSON."
            : "Look at this image and write 3 social media captions: 1 funny, 1 deep/meaningful, and 1 minimal. Also provide 10 relevant hashtags. Return JSON.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/png' } },
                    { text: prompt },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        captions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["captions", "hashtags"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return { captions: [], hashtags: [] };
    } catch (error) {
        return { captions: [], hashtags: [] };
    }
};

export const extractColorPalette = async (base64Image: string): Promise<string[]> => {
    try {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const prompt = "Extract the 5 dominant colors from this image. Return a JSON array of hex color strings (e.g., ['#FF0000', ...]).";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/png' } },
                    { text: prompt },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (error) {
        return [];
    }
};

export const createStickerFromImage = async (base64Image: string): Promise<string | null> => {
    try {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

        // Step 1: Analyze image to get subject description using Flash
        const analysisPrompt = "Describe the main subject of this image in 5-7 words for a sticker prompt (e.g., 'a cute sleeping cat'). Return only the description.";
        const analysisResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/png' } },
                    { text: analysisPrompt },
                ],
            },
        });
        
        const subjectDescription = analysisResponse.text || "a cute character";

        // Step 2: Generate sticker using Imagen
        const stickerPrompt = `A vector art sticker of ${subjectDescription}. White outline, high quality, flat design, isolated on white background, vibrant colors, cute style.`;
        
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: stickerPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1',
                outputMimeType: 'image/png',
            },
        });

        const generatedBase64 = imageResponse.generatedImages?.[0]?.image?.imageBytes;
        if (generatedBase64) {
            return `data:image/png;base64,${generatedBase64}`;
        }
        return null;

    } catch (error) {
        console.error("Sticker generation failed:", error);
        return null;
    }
};
