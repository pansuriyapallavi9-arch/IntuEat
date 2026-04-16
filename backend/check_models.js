require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("NO API KEY FOUND in .env");
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach(m => {
        if (m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("NO MODELS OR ERROR:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

checkModels();
