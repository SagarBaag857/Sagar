// utils/vision.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyse a base64-encoded image and try to extract a list of recognizable ingredients.
 * NOTE: This is a placeholder. Ideally you would use a dedicated vision model (e.g., Clarifai, Google Vision, or OpenAI Vision) with proper access.
 * For demonstration, we'll pass the image to GPT with vision enabled (if available) or return a mocked list.
 * @param {string} base64Image
 * @returns {Promise<string[]>}
 */
export async function analyseImageForIngredients(base64Image) {
  if (!process.env.OPENAI_VISION_ENABLED) {
    // Fallback mocked behaviour
    console.warn('Vision API disabled, returning mocked ingredients.');
    return ['tomato', 'cheese', 'lettuce'];
  }

  // Real call using GPT-4o or GPT-4o vision (if available)
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that identifies food items in images and returns a JSON array of distinct ingredient names.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What ingredients are visible in this photo? Respond ONLY with a JSON array of simple ingredient names.'
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` }
            }
          ]
        }
      ]
    });

    const responseText = completion.choices[0].message.content;
    const ingredients = JSON.parse(responseText);
    return ingredients;
  } catch (err) {
    console.error('Vision error', err);
    return [];
  }
}