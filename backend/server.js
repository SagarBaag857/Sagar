// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

import { generateRecipes } from './utils/openai.js';
import { analyseImageForIngredients } from './utils/vision.js';

// Configure environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Set up Multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * POST /api/recipes
 * Body (JSON): {
 *   ingredients?: string[],
 *   image?: base64 string,
 *   budgetMode?: boolean
 * }
 */
app.post('/api/recipes', async (req, res) => {
  try {
    let { ingredients = [], image = null, budgetMode = false } = req.body;

    // If an image is provided but no ingredient list, try to detect ingredients from the image
    if ((!ingredients || ingredients.length === 0) && image) {
      ingredients = await analyseImageForIngredients(image);
    }

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'No ingredients provided or detected.' });
    }

    const response = await generateRecipes(ingredients, { budgetMode });

    res.json(response);
  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Image upload endpoint (as an alternative for multipart/form-data)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const ingredients = await analyseImageForIngredients(base64Image);

    res.json({ ingredients });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`);
});