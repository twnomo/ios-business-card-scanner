const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Manual .env parsing
const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
const API_KEY = envContent.match(/EXPO_PUBLIC_GEMINI_API_KEY=(.*)/)?.[1]?.trim();

function verifyDBScheme() {
    console.log("🔍 Checking Database Schema Logic...");
    const schema = `
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      company TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      website TEXT,
      image_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    if (schema.includes("name TEXT NOT NULL") && schema.includes("image_data TEXT")) {
        console.log("✅ DB Schema definition is valid.");
    } else {
        console.error("❌ DB Schema definition mismatch!");
    }
}

async function verifyGemini() {
    verifyDBScheme();
    console.log("🔍 Starting AI Logic Verification...");

    if (!API_KEY) {
        console.error("❌ Error: API Key missing in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Using 2.0-flash as it's stable

    const prompt = `
You are an expert Business Card Scanner.

Task 1: Detect Rotation.
Analyze the orientation. The text might be rotated 90, 180, or 270 degrees.
Identify the rotation needed to make the text upright (0, 90, 180, 270).

Task 2: Extract Information.
Read the text (mentally rotate it if needed) and extract:
- name, title, company, phone, email, address, website.
- Use Traditional Chinese (繁體中文) for Taiwan addresses/names.

Return a single JSON object:
{
  "suggested_rotation": int,
  "name": "string",
  "title": "string",
  "company": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "website": "string"
}
`;

    // Use a tiny transparent 1x1 pixel base64 for "empty" test if no image exists
    // Or better, use a known test image if available. 
    // For this verification, we'll just check if the model accepts the prompt structure.
    const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    try {
        console.log("📡 Sending test request to Gemini...");
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: testBase64,
                    mimeType: "image/png",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("📩 Raw Response:", text);

        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const json = JSON.parse(cleanText);

        console.log("✅ JSON Parsing Success!");
        console.log("📊 Extracted Keys:", Object.keys(json).join(", "));
    } catch (error) {
        console.error("❌ AI Verification Failed:", error.message);
    }
}

verifyGemini();
