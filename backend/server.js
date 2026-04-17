require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/intueat';
const JWT_SECRET = process.env.JWT_SECRET || 'intueat-dev-secret';

const allowedOrigins = [FRONTEND_URL, 'http://127.0.0.1:5173', 'http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Resilient Mongoose Connection
mongoose.connect(MONGO_URL)
  .then(() => console.log('MongoDB successfully connected (MERN Stack Active)'))
  .catch((err) => console.log('MongoDB connection warning (auth/storage requires database):', err.message));

const MealEntrySchema = new mongoose.Schema(
  {
    date: { type: String, default: '' },
    type: { type: String, default: 'snack' },
    name: { type: String, default: '' },
    cals: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    score: { type: mongoose.Schema.Types.Mixed, default: 'N/A' },
    source: { type: String, default: 'manual' },
    barcode: { type: String, default: '' },
    brand: { type: String, default: '' },
    servingSize: { type: String, default: '' },
    scanRecordId: { type: String, default: '' },
    description: { type: String, default: '' },
    allergens: { type: [String], default: [] },
  },
  { _id: true, timestamps: true }
);

const WaterLogSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true },
    glasses: { type: Number, default: 0 },
    goal: { type: Number, default: 8 },
  },
  { _id: true, timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    age: { type: Number, default: null },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    gender: { type: String, default: 'female' },
    goal: { type: String, default: 'maintain' },
    diet: { type: String, default: 'veg' },
    deficiencies: { type: [String], default: [] },
    mealHistory: { type: [MealEntrySchema], default: [] },
    waterLogs: { type: [WaterLogSchema], default: [] },
    profileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    age: this.age,
    height: this.height,
    weight: this.weight,
    gender: this.gender,
    goal: this.goal,
    diet: this.diet,
    deficiencies: this.deficiencies || [],
    mealHistory: this.mealHistory || [],
    waterLogs: this.waterLogs || [],
    profileCompleted: this.profileCompleted,
  };
};

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const BarcodeScanSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, index: true },
    product_name: { type: String, default: '' },
    brands: { type: String, default: '' },
    categories: { type: [String], default: [] },
    ingredients_text: { type: String, default: '' },
    allergens: { type: [String], default: [] },
    serving_size: { type: String, default: '' },
    packaging: { type: String, default: '' },
    description: { type: String, default: '' },
    countries: { type: [String], default: [] },
    url: { type: String, default: '' },
    image_url: { type: String, default: '' },
    nutriments: {
      'energy-kcal_100g': { type: Number, default: 0 },
      proteins_100g: { type: Number, default: 0 },
      carbohydrates_100g: { type: Number, default: 0 },
      fat_100g: { type: Number, default: 0 },
      sugars_100g: { type: Number, default: 0 },
      salt_100g: { type: Number, default: 0 },
    },
    nutriscore_grade: { type: String, default: '' },
    source: { type: String, default: 'gemini' },
    scannedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);
const BarcodeScanModel = mongoose.models.BarcodeScan || mongoose.model('BarcodeScan', BarcodeScanSchema);

const savedBarcodeScans = [];
const GEMINI_MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.0-flash'];

const sanitizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizeBarcodeProduct = (payload = {}, barcode) => ({
  barcode: String(payload.barcode || barcode || '').trim(),
  product_name: String(payload.product_name || '').trim(),
  brands: String(payload.brands || '').trim(),
  categories: sanitizeList(payload.categories),
  ingredients_text: String(payload.ingredients_text || '').trim(),
  allergens: sanitizeList(payload.allergens),
  serving_size: String(payload.serving_size || '').trim(),
  packaging: String(payload.packaging || '').trim(),
  description: String(payload.description || '').trim(),
  countries: sanitizeList(payload.countries),
  url: String(payload.url || '').trim(),
  image_url: String(payload.image_url || '').trim(),
  nutriments: {
    'energy-kcal_100g': sanitizeNumber(payload.nutriments?.['energy-kcal_100g']),
    proteins_100g: sanitizeNumber(payload.nutriments?.proteins_100g),
    carbohydrates_100g: sanitizeNumber(payload.nutriments?.carbohydrates_100g),
    fat_100g: sanitizeNumber(payload.nutriments?.fat_100g),
    sugars_100g: sanitizeNumber(payload.nutriments?.sugars_100g),
    salt_100g: sanitizeNumber(payload.nutriments?.salt_100g),
  },
  nutriscore_grade: String(payload.nutriscore_grade || '').trim().toLowerCase(),
  source: 'gemini',
});

const persistBarcodeScan = async (product) => {
  const payload = { ...product, scannedAt: new Date() };

  if (mongoose.connection.readyState === 1) {
    const saved = await BarcodeScanModel.create(payload);
    return { id: saved._id.toString(), scannedAt: saved.scannedAt };
  }

  const memoryRecord = {
    id: `memory-${Date.now()}`,
    ...payload,
  };
  savedBarcodeScans.unshift(memoryRecord);
  return { id: memoryRecord.id, scannedAt: memoryRecord.scannedAt };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateGeminiText = async (content, options = {}) => {
  const { maxRetries = 2 } = options;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError = null;

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const result = await model.generateContent(content);
        return result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      } catch (error) {
        lastError = error;
        const isRetryable = error?.status === 429 || error?.status === 500 || error?.status === 503;

        if (isRetryable && attempt < maxRetries) {
          await sleep(500 * (attempt + 1));
          continue;
        }

        if (!isRetryable) {
          break;
        }
      }
    }
  }

  throw lastError;
};

const isGeminiTemporaryFailure = (error) =>
  error?.status === 429 || error?.status === 500 || error?.status === 503;

const buildFallbackMealAnalysis = ({ image, foodName, weight, error = null }) => {
  const weightVal = parseFloat(weight) || 100;
  const finalDetectedName = image ? 'Mixed Meal' : (foodName || 'Unknown Meal');
  const cleanName = finalDetectedName.toLowerCase().trim();

  const mockDatabase = {
    apple: { kcal: 52, p: 0.3, c: 14, f: 0.2 },
    banana: { kcal: 89, p: 1.1, c: 23, f: 0.3 },
    coffee: { kcal: 1, p: 0.1, c: 0, f: 0 },
    pizza: { kcal: 266, p: 11, c: 33, f: 10 },
    salad: { kcal: 17, p: 1.2, c: 3.3, f: 0.2 },
    'mixed meal': { kcal: 180, p: 7, c: 24, f: 7 },
    'unknown meal': { kcal: 160, p: 6, c: 20, f: 6 },
  };

  let baseStats = mockDatabase[cleanName];
  if (!baseStats) {
    const hash = cleanName.length;
    baseStats = { kcal: 50 + hash * 10, p: hash, c: hash * 2, f: hash / 2 };
  }

  const multiplier = weightVal / 100;
  const aiResponse = {
    calories: baseStats.kcal * multiplier,
    protein: baseStats.p * multiplier,
    carbs: baseStats.c * multiplier,
    fat: baseStats.f * multiplier,
    suggestions: [
      { title: 'Squeeze Lemon on Top', reason: `Boost your Vitamin C and elevate the flavor of your ${finalDetectedName} by adding a squeeze of fresh lemon.` },
      { title: 'Pair with Almonds', reason: 'Add a handful of almonds for healthy fats and a protein boost.' },
    ],
  };

  let score = 10;
  if (aiResponse.fat > 20) score -= (aiResponse.fat - 20) * 0.1;
  if (aiResponse.protein > 15) score += 1;
  score = Math.max(0, Math.min(10, score)).toFixed(1);

  return {
    name: `${weightVal}g of ${finalDetectedName.charAt(0).toUpperCase() + finalDetectedName.slice(1)}`,
    calories: Math.round(aiResponse.calories),
    protein: parseFloat(aiResponse.protein.toFixed(1)),
    carbs: parseFloat(aiResponse.carbs.toFixed(1)),
    fat: parseFloat(aiResponse.fat.toFixed(1)),
    score,
    suggestions: aiResponse.suggestions,
    fallback: true,
    fallbackMessage: image
      ? 'Gemini could not identify this dish right now, so this is a generic meal estimate instead of a food-specific result.'
      : 'Gemini could not identify this meal right now, so this is a generic estimate.',
    geminiError: error
      ? {
          status: error.status || null,
          message: error.message || 'Unknown Gemini error',
        }
      : null,
  };
};

const buildFallbackSuggestions = () => ([
  {
    title: 'Boost Iron with Citrus',
    reason: 'Try adding lemon, orange, or amla near iron-rich meals to improve absorption.',
  },
  {
    title: 'Protein Pacing',
    reason: 'Spread protein across breakfast, lunch, and dinner instead of packing it into one meal.',
  },
]);

const buildFallbackBarcodeProduct = (barcode) => ({
  barcode: String(barcode || '').trim(),
  product_name: `Barcode ${barcode}`,
  brands: '',
  categories: [],
  ingredients_text: '',
  allergens: [],
  serving_size: '100 g',
  packaging: '',
  description: 'Product details are temporarily unavailable from Gemini, but this barcode was still saved for tracking.',
  countries: [],
  url: '',
  image_url: '',
  nutriments: {
    'energy-kcal_100g': 0,
    proteins_100g: 0,
    carbohydrates_100g: 0,
    fat_100g: 0,
    sugars_100g: 0,
    salt_100g: 0,
  },
  nutriscore_grade: '',
  source: 'fallback',
});

const ensureDatabaseConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database connection is not available.' });
    return false;
  }
  return true;
};

const createAuthToken = (user) =>
  jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User session is invalid.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};

const getTodayDateKey = () => new Date().toISOString().slice(0, 10);

app.post('/api/auth/register', async (req, res) => {
  if (!ensureDatabaseConnection(res)) return;

  try {
    const { name = '', email = '', password = '' } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      profileCompleted: false,
    });

    return res.status(201).json({
      token: createAuthToken(user),
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  if (!ensureDatabaseConnection(res)) return;

  try {
    const { email = '', password = '' } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.json({
      token: createAuthToken(user),
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Failed to sign in.' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  return res.json({ user: req.user.toSafeObject() });
});

app.put('/api/user/profile', authMiddleware, async (req, res) => {
  if (!ensureDatabaseConnection(res)) return;

  try {
    const updates = {
      name: String(req.body.name || '').trim(),
      age: req.body.age === '' || req.body.age == null ? null : Number(req.body.age),
      height: req.body.height === '' || req.body.height == null ? null : Number(req.body.height),
      weight: req.body.weight === '' || req.body.weight == null ? null : Number(req.body.weight),
      gender: String(req.body.gender || 'female'),
      goal: String(req.body.goal || 'maintain'),
      diet: String(req.body.diet || 'veg'),
      deficiencies: Array.isArray(req.body.deficiencies) ? req.body.deficiencies : [],
      profileCompleted: true,
    };

    Object.assign(req.user, updates);
    await req.user.save();

    return res.json({ success: true, user: req.user.toSafeObject() });
  } catch (error) {
    console.error('Profile Update Error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

app.post('/api/user/meal-history', authMiddleware, async (req, res) => {
  if (!ensureDatabaseConnection(res)) return;

  try {
    const meal = {
      date: String(req.body.date || '').trim(),
      type: String(req.body.type || 'snack').trim(),
      name: String(req.body.name || '').trim(),
      cals: Number(req.body.cals) || 0,
      protein: Number(req.body.protein) || 0,
      carbs: Number(req.body.carbs) || 0,
      fat: Number(req.body.fat) || 0,
      score: req.body.score ?? 'N/A',
      source: String(req.body.source || 'manual').trim(),
      barcode: String(req.body.barcode || '').trim(),
      brand: String(req.body.brand || '').trim(),
      servingSize: String(req.body.servingSize || '').trim(),
      scanRecordId: String(req.body.scanRecordId || '').trim(),
      description: String(req.body.description || '').trim(),
      allergens: Array.isArray(req.body.allergens) ? req.body.allergens : [],
    };

    req.user.mealHistory.unshift(meal);
    await req.user.save();

    return res.status(201).json({
      success: true,
      mealHistory: req.user.mealHistory,
      meal: req.user.mealHistory[0],
    });
  } catch (error) {
    console.error('Meal History Save Error:', error);
    return res.status(500).json({ error: 'Failed to save meal history.' });
  }
});

app.put('/api/user/water-intake', authMiddleware, async (req, res) => {
  if (!ensureDatabaseConnection(res)) return;

  try {
    const dateKey = String(req.body.dateKey || getTodayDateKey());
    const glasses = Math.max(0, Number(req.body.glasses) || 0);
    const goal = Math.max(1, Number(req.body.goal) || 8);

    const existingLog = req.user.waterLogs.find((log) => log.dateKey === dateKey);
    if (existingLog) {
      existingLog.glasses = glasses;
      existingLog.goal = goal;
    } else {
      req.user.waterLogs.push({ dateKey, glasses, goal });
    }

    await req.user.save();

    return res.json({
      success: true,
      waterLogs: req.user.waterLogs,
    });
  } catch (error) {
    console.error('Water Intake Save Error:', error);
    return res.status(500).json({ error: 'Failed to save water intake.' });
  }
});

// AGENTIC AI ENDPOINT
// This backend agent receives Base64 Image & Weight
// It autonomously orchestrates with Gemini Multimodal AI for exact real-world macros.
app.post('/api/agent/meal-analysis', async (req, res) => {
  const { image, foodName, weight } = req.body;

  try {
    if (process.env.GEMINI_API_KEY) {
      const weightVal = parseFloat(weight) || 100;
      let finalDetectedName = foodName || "Unknown Food";
      const prompt = `As an expert nutritionist Agent. Look at this image (if provided) or use the food name "${foodName}". 
Identify the primary food item. Calculate precise macronutrients for an exact weight of ${weightVal}g.
Provide 2 creative dietary suggestions to pair or add with this food to fulfill nutritional deficiencies (e.g., if it's apple, suggest adding lemon for Vit C, or pair with nuts for healthy fats).
Return ONLY a valid JSON object with the following keys exactly, absolutely no markdown formatting or extra text: 
{ "foodName": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "suggestions": [{ "title": "string", "reason": "string" }] }`;

      let parts = [{ text: prompt }];

      if (image) {
        // Strip data:image/jpeg;base64,
        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
             data: base64Data,
             mimeType: mimeType
          }
        });
      }

      const responseText = await generateGeminiText(parts);
      const parsed = JSON.parse(responseText);
      finalDetectedName = parsed.foodName;
      let score = 10;
      if (parsed.fat > 20) score -= (parsed.fat - 20) * 0.1;
      if (parsed.protein > 15) score += 1;
      score = Math.max(0, Math.min(10, score)).toFixed(1);

      return res.json({
        name: `${weightVal}g of ${finalDetectedName.charAt(0).toUpperCase() + finalDetectedName.slice(1)}`,
        calories: Math.round(parsed.calories),
        protein: parseFloat(parsed.protein.toFixed(1)),
        carbs: parseFloat(parsed.carbs.toFixed(1)),
        fat: parseFloat(parsed.fat.toFixed(1)),
        score,
        suggestions: parsed.suggestions || [],
      });
    }
    
    return res.json(buildFallbackMealAnalysis({ image, foodName, weight }));
  } catch (error) {
    if (isGeminiTemporaryFailure(error)) {
      console.warn('Agent Orchestration Fallback:', error.message);
      return res.json(buildFallbackMealAnalysis({ image, foodName, weight, error }));
    }

    console.error('Agent Orchestration Error:', error);
    return res.status(500).json({ error: `Agent Error: ${error.message}` });
  }
});

// AI Suggestions logic
app.post('/api/agent/suggestions', async (req, res) => {
  const { deficiencies, history } = req.body;
  
  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `As an expert AI Nutritionist. 
The user has the following known deficiencies: ${Array.isArray(deficiencies) ? deficiencies.join(', ') : 'None'}.
Their recent meal history is: ${JSON.stringify(history?.slice(0, 5) || [])}

Provide exactly 2 highly actionable, encouraging, and specific dietary suggestions. 
Return ONLY a valid JSON array of objects. Format:
[ { "title": "string", "reason": "string" }, ... ]`;

      const responseText = await generateGeminiText(prompt);
      return res.json(JSON.parse(responseText));
    }

    return res.json(buildFallbackSuggestions());
  } catch (err) {
    if (isGeminiTemporaryFailure(err)) {
      console.warn('Suggestions Fallback:', err.message);
      return res.json(buildFallbackSuggestions());
    }

    console.error(err);
    return res.status(500).json({ error: "Failed to generate suggestions." });
  }
});

app.post('/api/agent/barcode-product', async (req, res) => {
  const { barcode } = req.body;

  if (!barcode) {
    return res.status(400).json({ error: 'Barcode is required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    const fallbackProduct = buildFallbackBarcodeProduct(barcode);
    const saved = await persistBarcodeScan(fallbackProduct);
    return res.json({ ...fallbackProduct, savedScanId: saved.id, scannedAt: saved.scannedAt });
  }

  try {
    const prompt = `You are a nutrition barcode tracking agent for a food diary app.
Given the barcode number ${barcode}, identify the packaged food product and return exactly one valid JSON object.

Required fields:
{
  "barcode": "string",
  "product_name": "string",
  "brands": "string",
  "categories": ["string"],
  "ingredients_text": "string",
  "allergens": ["string"],
  "serving_size": "string",
  "packaging": "string",
  "description": "string",
  "countries": ["string"],
  "url": "string",
  "image_url": "string",
  "nutriments": {
    "energy-kcal_100g": number,
    "proteins_100g": number,
    "carbohydrates_100g": number,
    "fat_100g": number,
    "sugars_100g": number,
    "salt_100g": number
  },
  "nutriscore_grade": "string"
}

Rules:
- Return JSON only. No markdown.
- Prefer globally common packaged-food data that is useful for nutrition tracking.
- If uncertain, leave fields empty instead of inventing specifics.
- Keep arrays as arrays, not comma-separated strings.
- Nutriment values must be numbers in per-100g terms. Use 0 when unknown.`;

    const responseText = await generateGeminiText(prompt, { maxRetries: 3 });
    const parsed = JSON.parse(responseText);
    const product = sanitizeBarcodeProduct(parsed, barcode);
    const saved = await persistBarcodeScan(product);

    res.json({
      ...product,
      savedScanId: saved.id,
      scannedAt: saved.scannedAt,
    });
  } catch (err) {
    if (isGeminiTemporaryFailure(err)) {
      console.warn('Barcode Product Fallback:', err.message);
      const fallbackProduct = buildFallbackBarcodeProduct(barcode);
      const saved = await persistBarcodeScan(fallbackProduct);
      return res.json({ ...fallbackProduct, savedScanId: saved.id, scannedAt: saved.scannedAt, fallback: true });
    }

    console.error('Barcode Product Gemini Error:', err);
    return res.status(500).json({ error: 'Gemini failed to resolve barcode product details.' });
  }
});

app.listen(PORT, () => {
  console.log(`Agentic Backend Orchestrator running on port ${PORT}`);
});
