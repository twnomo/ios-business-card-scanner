import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Gemini API Key is missing! Please set EXPO_PUBLIC_GEMINI_API_KEY.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface ExtractedData {
    suggested_rotation: number;
    name: string;
    title: string;
    company: string;
    phone: string;
    mobile_phone: string;
    email: string;
    address: string;
    website: string;
}

export const processImage = async (base64Image: string): Promise<ExtractedData> => {
    const prompt = `
You are an expert Business Card Scanner.

Task 1: Detect Rotation.
Identify the rotation needed for the business card to be upright (0, 90, 180, 270).

Task 2: Extract Information.
Read the text and extract:
- name, title, company, phone (office), mobile_phone, email, address, website.
- Use Traditional Chinese (繁體中文) for Taiwan addresses/names.

Return a single JSON object:
{
  "suggested_rotation": int,
  "name": "string",
  "title": "string",
  "company": "string",
  "phone": "string",
  "mobile_phone": "string",
  "email": "string",
  "address": "string",
  "website": "string"
}
`;

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText) as ExtractedData;
    } catch (error) {
        console.error("Gemini Processing Error:", error);
        throw error;
    }
};
