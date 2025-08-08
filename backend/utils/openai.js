// utils/openai.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate recipes with step-by-step instructions and nutrition breakdown.
 * @param {string[]} ingredients - List of available ingredients.
 * @param {{budgetMode?: boolean}} options
 * @returns {Promise<{recipes: Array}>}
 */
export async function generateRecipes(ingredients, { budgetMode = false } = {}) {
  const systemPrompt = `You are an expert chef and nutritionist. A user will give you a list of ingredients they have available in their fridge or pantry. Using those items you must suggest ONE complete recipe including:\n\n1. A catchy recipe name\n2. A short description (1-2 sentences)\n3. A clear list of all ingredients with exact quantities (metric)\n4. Step-by-step cooking instructions\n5. Estimated nutrition breakdown (per serving: calories, protein, carbs, fat)\n${budgetMode ? '6. Keep the recipe extremely low cost, prioritizing cheap ingredients and suggesting money-saving tips.' : ''}`;

  const userPrompt = `Ingredients: ${ingredients.join(', ')}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
  });

  const answer = completion.choices[0].message.content;

  return { recipe: answer };
}