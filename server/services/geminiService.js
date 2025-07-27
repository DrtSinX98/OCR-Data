// /server/services/geminiService.js
const fs = require("fs");
const { GoogleGenAI, Modality } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,   // your API key
  // vertexai: true, project: "...", location: "..." // if using Vertex AI
});

async function extractOdiaText(base64Image) {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType: "image/png", data: base64Image } },
        { text: "Extract and return the Odia text from this image only." }
      ],
      config: { responseModalities: [Modality.TEXT] }
    });

    return res.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (e) {
    console.error("Gemini SDK error:", e);
    throw new Error("Gemini processing failed");
  }
}

module.exports = { extractOdiaText };
