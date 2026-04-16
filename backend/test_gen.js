require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeneration() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("NO API KEY");
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log("Sending request to Gemini 2.5 Flash...");
    const result = await model.generateContent("Say hello!");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("SDK Error:", err.message);
    if (err.cause) console.error("Cause:", err.cause);
  }
}

testGeneration();
