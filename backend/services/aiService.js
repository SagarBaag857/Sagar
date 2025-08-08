/**
 * AI Service
 * 
 * AI-powered recipe generation service using OpenAI GPT models
 * and natural language processing for creating personalized recipes
 * based on available ingredients and user preferences.
 */

const OpenAI = require('openai');
const natural = require('natural');
const compromise = require('compromise');
const sentiment = require('sentiment');
const fs = require('fs-extra');
const path = require('path');

class AIService {
  constructor() {
    this.openai = null;
    this.initialized = false;
    this.stemmer = natural.PorterStemmer;
    this.sentiment = new sentiment();
    this.recipeTemplates = new Map();
    this.cuisineStyles = new Map();
    this.difficultyLevels = new Map();
    
    // Recipe generation parameters
    this.defaultParams = {
      temperature: 0.7,
      maxTokens: 2000,
      presencePenalty: 0.3,
      frequencyPenalty: 0.5
    };
    
    // Initialize cuisine styles and templates
    this.initializeCuisineStyles();
    this.initializeRecipeTemplates();
    this.initializeDifficultyLevels();
  }

  /**
   * Initialize the AI service
   */
  async initialize() {
    try {
      console.log('🔄 Initializing AI Service...');
      
      // Initialize OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ OpenAI API initialized');
      } else {
        console.warn('⚠️ OpenAI API key not found, using fallback methods');
      }
      
      // Load recipe knowledge base
      await this.loadRecipeKnowledgeBase();
      
      this.initialized = true;
      console.log('✅ AI Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error.message);
      throw new Error(`AI Service initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize cuisine styles
   */
  initializeCuisineStyles() {
    this.cuisineStyles.set('italian', {
      commonIngredients: ['tomato', 'garlic', 'olive oil', 'basil', 'parmesan', 'pasta'],
      cookingMethods: ['sautéing', 'simmering', 'roasting', 'grilling'],
      flavor_profile: 'rich, herbaceous, tomato-forward',
      typical_spices: ['oregano', 'thyme', 'rosemary', 'black pepper']
    });
    
    this.cuisineStyles.set('chinese', {
      commonIngredients: ['soy sauce', 'ginger', 'garlic', 'rice', 'vegetables'],
      cookingMethods: ['stir-frying', 'steaming', 'braising', 'deep-frying'],
      flavor_profile: 'umami, balanced sweet and salty',
      typical_spices: ['five-spice', 'white pepper', 'star anise', 'sesame oil']
    });
    
    this.cuisineStyles.set('mexican', {
      commonIngredients: ['beans', 'corn', 'tomatoes', 'peppers', 'lime', 'cilantro'],
      cookingMethods: ['grilling', 'braising', 'sautéing', 'roasting'],
      flavor_profile: 'spicy, citrusy, earthy',
      typical_spices: ['cumin', 'chili powder', 'paprika', 'oregano']
    });
    
    this.cuisineStyles.set('indian', {
      commonIngredients: ['rice', 'lentils', 'onions', 'tomatoes', 'yogurt', 'coconut'],
      cookingMethods: ['curry making', 'tempering', 'slow cooking', 'tandoori'],
      flavor_profile: 'complex spices, aromatic, rich',
      typical_spices: ['turmeric', 'cumin', 'coriander', 'garam masala', 'cardamom']
    });
    
    this.cuisineStyles.set('mediterranean', {
      commonIngredients: ['olive oil', 'lemon', 'herbs', 'vegetables', 'fish', 'grains'],
      cookingMethods: ['grilling', 'roasting', 'braising', 'raw preparations'],
      flavor_profile: 'fresh, light, herbaceous',
      typical_spices: ['oregano', 'thyme', 'rosemary', 'sumac', 'za\'atar']
    });
  }

  /**
   * Initialize recipe templates
   */
  initializeRecipeTemplates() {
    this.recipeTemplates.set('main-course', {
      structure: ['protein preparation', 'vegetable preparation', 'cooking method', 'seasoning', 'serving'],
      typical_time: { prep: 15, cook: 30 },
      serving_size: 4
    });
    
    this.recipeTemplates.set('salad', {
      structure: ['base preparation', 'toppings', 'dressing', 'assembly'],
      typical_time: { prep: 10, cook: 0 },
      serving_size: 4
    });
    
    this.recipeTemplates.set('soup', {
      structure: ['aromatics', 'liquid base', 'main ingredients', 'seasoning', 'simmering'],
      typical_time: { prep: 10, cook: 45 },
      serving_size: 6
    });
    
    this.recipeTemplates.set('dessert', {
      structure: ['mixing', 'preparation method', 'baking/chilling', 'finishing'],
      typical_time: { prep: 20, cook: 30 },
      serving_size: 8
    });
  }

  /**
   * Initialize difficulty levels
   */
  initializeDifficultyLevels() {
    this.difficultyLevels.set('easy', {
      max_ingredients: 8,
      max_steps: 6,
      cooking_methods: ['sautéing', 'boiling', 'baking', 'grilling'],
      techniques: ['chopping', 'mixing', 'seasoning'],
      time_limit: 45
    });
    
    this.difficultyLevels.set('medium', {
      max_ingredients: 12,
      max_steps: 10,
      cooking_methods: ['braising', 'roasting', 'stir-frying', 'simmering'],
      techniques: ['marinating', 'reducing', 'tempering', 'caramelizing'],
      time_limit: 90
    });
    
    this.difficultyLevels.set('hard', {
      max_ingredients: 20,
      max_steps: 15,
      cooking_methods: ['sous vide', 'confit', 'smoking', 'fermentation'],
      techniques: ['emulsification', 'spherification', 'lamination', 'precision timing'],
      time_limit: 180
    });
  }

  /**
   * Load recipe knowledge base
   */
  async loadRecipeKnowledgeBase() {
    try {
      // Load common ingredient combinations
      this.ingredientPairings = new Map([
        ['tomato', ['basil', 'mozzarella', 'garlic', 'olive oil']],
        ['chicken', ['thyme', 'lemon', 'garlic', 'rosemary']],
        ['beef', ['onion', 'mushroom', 'red wine', 'thyme']],
        ['salmon', ['dill', 'lemon', 'capers', 'asparagus']],
        ['potato', ['rosemary', 'garlic', 'butter', 'chives']],
        ['apple', ['cinnamon', 'nutmeg', 'butter', 'sugar']],
        ['chocolate', ['vanilla', 'cream', 'coffee', 'nuts']]
      ]);
      
      // Load cooking time estimates
      this.cookingTimes = new Map([
        ['chicken breast', { prep: 5, cook: 20 }],
        ['ground beef', { prep: 5, cook: 15 }],
        ['salmon fillet', { prep: 5, cook: 12 }],
        ['pasta', { prep: 2, cook: 12 }],
        ['rice', { prep: 2, cook: 18 }],
        ['potatoes', { prep: 10, cook: 25 }],
        ['broccoli', { prep: 5, cook: 8 }],
        ['onion', { prep: 5, cook: 10 }]
      ]);
      
      console.log('📚 Recipe knowledge base loaded');
      
    } catch (error) {
      console.warn('⚠️ Could not load recipe knowledge base:', error.message);
    }
  }

  /**
   * Generate recipe from ingredients
   */
  async generateRecipeFromIngredients(ingredients, preferences = {}) {
    if (!this.initialized) {
      throw new Error('AI service not initialized');
    }

    try {
      console.log('🧠 Generating recipe from ingredients...');
      
      // Analyze ingredients
      const ingredientAnalysis = this.analyzeIngredients(ingredients);
      
      // Build generation context
      const context = this.buildGenerationContext(ingredients, preferences, ingredientAnalysis);
      
      // Generate recipe using AI
      let recipe;
      if (this.openai) {
        recipe = await this.generateWithOpenAI(context);
      } else {
        recipe = await this.generateWithFallback(context);
      }
      
      // Enhance recipe with additional information
      const enhancedRecipe = await this.enhanceRecipe(recipe, ingredients, preferences);
      
      console.log(`✅ Generated recipe: ${enhancedRecipe.title}`);
      return enhancedRecipe;
      
    } catch (error) {
      console.error('❌ Error generating recipe:', error.message);
      throw new Error(`Recipe generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze ingredients for recipe generation
   */
  analyzeIngredients(ingredients) {
    const analysis = {
      categories: {},
      proteins: [],
      vegetables: [],
      seasonings: [],
      staples: [],
      dominant_cuisine: null,
      cooking_methods: [],
      estimated_servings: 4,
      complexity_score: 0
    };
    
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      const category = ingredient.category || 'other';
      
      // Categorize ingredients
      analysis.categories[category] = (analysis.categories[category] || 0) + 1;
      
      // Identify key ingredient types
      if (category === 'proteins') {
        analysis.proteins.push(name);
      } else if (category === 'vegetables') {
        analysis.vegetables.push(name);
      } else if (category === 'spices' || category === 'herbs') {
        analysis.seasonings.push(name);
      } else if (category === 'grains' || category === 'dairy') {
        analysis.staples.push(name);
      }
      
      // Calculate complexity
      analysis.complexity_score += this.getIngredientComplexity(name);
    });
    
    // Determine dominant cuisine
    analysis.dominant_cuisine = this.inferCuisineFromIngredients(ingredients);
    
    // Suggest cooking methods
    analysis.cooking_methods = this.suggestCookingMethods(ingredients);
    
    return analysis;
  }

  /**
   * Build generation context for AI
   */
  buildGenerationContext(ingredients, preferences, analysis) {
    const context = {
      ingredients: ingredients.map(i => ({
        name: i.name,
        category: i.category,
        available_amount: i.quantity || 'sufficient'
      })),
      
      preferences: {
        cuisine: preferences.cuisine || analysis.dominant_cuisine || 'fusion',
        difficulty: preferences.difficulty || 'medium',
        dietary_restrictions: preferences.dietaryRestrictions || [],
        max_time: preferences.maxTime || 60,
        servings: preferences.servings || 4,
        budget_conscious: preferences.budgetMode || false
      },
      
      analysis: analysis,
      
      constraints: {
        use_available_ingredients: true,
        minimize_additional_ingredients: preferences.budgetMode || false,
        respect_dietary_restrictions: true,
        target_nutrition_balance: preferences.healthyMode || false
      }
    };
    
    return context;
  }

  /**
   * Generate recipe using OpenAI
   */
  async generateWithOpenAI(context) {
    try {
      const prompt = this.buildOpenAIPrompt(context);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert chef and recipe creator. Generate detailed, practical recipes that are delicious and easy to follow. Always include precise measurements, cooking times, and step-by-step instructions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: this.defaultParams.temperature,
        max_tokens: this.defaultParams.maxTokens,
        presence_penalty: this.defaultParams.presencePenalty,
        frequency_penalty: this.defaultParams.frequencyPenalty
      });
      
      const generatedText = completion.choices[0].message.content;
      return this.parseGeneratedRecipe(generatedText, context);
      
    } catch (error) {
      console.warn('⚠️ OpenAI generation failed:', error.message);
      return await this.generateWithFallback(context);
    }
  }

  /**
   * Build OpenAI prompt for recipe generation
   */
  buildOpenAIPrompt(context) {
    const ingredients = context.ingredients.map(i => i.name).join(', ');
    const preferences = context.preferences;
    const analysis = context.analysis;
    
    let prompt = `Create a ${preferences.cuisine} recipe using these ingredients: ${ingredients}\n\n`;
    
    prompt += `Requirements:\n`;
    prompt += `- Difficulty: ${preferences.difficulty}\n`;
    prompt += `- Maximum cooking time: ${preferences.max_time} minutes\n`;
    prompt += `- Serves: ${preferences.servings} people\n`;
    
    if (preferences.dietary_restrictions.length > 0) {
      prompt += `- Dietary restrictions: ${preferences.dietary_restrictions.join(', ')}\n`;
    }
    
    if (preferences.budget_conscious) {
      prompt += `- Budget-friendly: Use primarily the provided ingredients, minimize additional ingredients\n`;
    }
    
    prompt += `\nPlease provide the recipe in this JSON format:\n`;
    prompt += `{
      "title": "Recipe Name",
      "description": "Brief description",
      "cuisine": "${preferences.cuisine}",
      "difficulty": "${preferences.difficulty}",
      "prep_time": minutes,
      "cook_time": minutes,
      "servings": ${preferences.servings},
      "ingredients": [
        {
          "name": "ingredient name",
          "quantity": number,
          "unit": "unit",
          "optional": false
        }
      ],
      "instructions": [
        {
          "step": 1,
          "instruction": "detailed instruction",
          "duration": minutes_if_applicable
        }
      ],
      "tags": ["tag1", "tag2"],
      "equipment": ["equipment1", "equipment2"],
      "tips": ["helpful tip 1", "helpful tip 2"]
    }`;
    
    return prompt;
  }

  /**
   * Generate recipe using fallback methods
   */
  async generateWithFallback(context) {
    try {
      const ingredients = context.ingredients;
      const preferences = context.preferences;
      const analysis = context.analysis;
      
      // Use template-based generation
      const template = this.recipeTemplates.get(analysis.suggested_category || 'main-course');
      const cuisineStyle = this.cuisineStyles.get(preferences.cuisine) || this.cuisineStyles.get('fusion');
      
      // Generate recipe title
      const mainIngredient = analysis.proteins[0] || analysis.vegetables[0] || ingredients[0].name;
      const title = this.generateRecipeTitle(mainIngredient, preferences.cuisine);
      
      // Generate ingredients list
      const recipeIngredients = this.generateIngredientsList(ingredients, preferences);
      
      // Generate instructions
      const instructions = this.generateInstructions(recipeIngredients, preferences, template);
      
      // Calculate timing
      const timing = this.calculateTiming(recipeIngredients, instructions);
      
      const recipe = {
        title: title,
        description: `A delicious ${preferences.cuisine} recipe featuring ${mainIngredient}`,
        cuisine: preferences.cuisine,
        category: analysis.suggested_category || 'main-course',
        difficulty: preferences.difficulty,
        timing: timing,
        servings: { count: preferences.servings },
        ingredients: recipeIngredients,
        instructions: instructions,
        equipment: this.suggestEquipment(instructions),
        tags: this.generateTags(ingredients, preferences),
        generatedFrom: 'ingredients-list',
        aiModel: 'fallback-template-based'
      };
      
      return recipe;
      
    } catch (error) {
      console.error('❌ Fallback generation failed:', error.message);
      throw new Error('All recipe generation methods failed');
    }
  }

  /**
   * Parse generated recipe from AI response
   */
  parseGeneratedRecipe(generatedText, context) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recipeData = JSON.parse(jsonMatch[0]);
        
        // Convert to our recipe format
        return {
          title: recipeData.title,
          description: recipeData.description,
          cuisine: recipeData.cuisine,
          difficulty: recipeData.difficulty,
          timing: {
            prep: recipeData.prep_time,
            cook: recipeData.cook_time,
            total: recipeData.prep_time + recipeData.cook_time
          },
          servings: { count: recipeData.servings },
          ingredients: recipeData.ingredients.map((ing, index) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            optional: ing.optional || false,
            category: this.categorizeIngredient(ing.name)
          })),
          instructions: recipeData.instructions.map(inst => ({
            step: inst.step,
            instruction: inst.instruction,
            duration: inst.duration || null
          })),
          equipment: recipeData.equipment || [],
          tags: recipeData.tags || [],
          generatedFrom: 'ingredients-list',
          aiModel: 'gpt-3.5-turbo'
        };
      } else {
        throw new Error('Could not parse JSON from AI response');
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to parse AI response, using fallback:', error.message);
      return await this.generateWithFallback(context);
    }
  }

  /**
   * Enhance recipe with additional information
   */
  async enhanceRecipe(recipe, originalIngredients, preferences) {
    try {
      // Add nutrition analysis
      recipe.nutrition = await this.calculateNutrition(recipe.ingredients);
      
      // Add cost analysis
      recipe.costAnalysis = await this.calculateCost(recipe.ingredients, preferences.budgetMode);
      
      // Add cooking tips
      recipe.tips = this.generateCookingTips(recipe);
      
      // Add substitutions
      recipe.substitutions = this.generateSubstitutions(recipe.ingredients);
      
      // Add difficulty explanation
      recipe.difficultyExplanation = this.explainDifficulty(recipe);
      
      // Add seasonal information
      recipe.seasonal = this.getSeasonalInfo(recipe.ingredients);
      
      return recipe;
      
    } catch (error) {
      console.warn('⚠️ Recipe enhancement failed:', error.message);
      return recipe; // Return basic recipe if enhancement fails
    }
  }

  /**
   * Generate recipe title
   */
  generateRecipeTitle(mainIngredient, cuisine) {
    const adjectives = {
      'italian': ['Classic', 'Traditional', 'Rustic', 'Homestyle'],
      'chinese': ['Authentic', 'Szechuan', 'Cantonese', 'Quick'],
      'mexican': ['Spicy', 'Traditional', 'Authentic', 'Fresh'],
      'indian': ['Aromatic', 'Spiced', 'Traditional', 'Curry-Style'],
      'mediterranean': ['Fresh', 'Herb-Crusted', 'Grilled', 'Light']
    };
    
    const preps = {
      'chicken': ['Grilled', 'Roasted', 'Sautéed', 'Braised'],
      'beef': ['Seared', 'Braised', 'Grilled', 'Slow-Cooked'],
      'fish': ['Pan-Seared', 'Baked', 'Grilled', 'Poached'],
      'vegetables': ['Roasted', 'Stir-Fried', 'Grilled', 'Sautéed']
    };
    
    const cuisineAdj = adjectives[cuisine] || ['Delicious'];
    const prepMethod = preps[mainIngredient] || ['Cooked'];
    
    const randomAdj = cuisineAdj[Math.floor(Math.random() * cuisineAdj.length)];
    const randomPrep = prepMethod[Math.floor(Math.random() * prepMethod.length)];
    
    return `${randomAdj} ${randomPrep} ${this.capitalize(mainIngredient)}`;
  }

  /**
   * Generate ingredients list for recipe
   */
  generateIngredientsList(availableIngredients, preferences) {
    const ingredients = [...availableIngredients];
    
    // Add common seasonings if budget mode is off
    if (!preferences.budget_conscious) {
      const commonSeasonings = [
        { name: 'salt', quantity: 1, unit: 'teaspoon', category: 'spices' },
        { name: 'black pepper', quantity: 0.5, unit: 'teaspoon', category: 'spices' },
        { name: 'olive oil', quantity: 2, unit: 'tablespoons', category: 'oils' }
      ];
      
      commonSeasonings.forEach(seasoning => {
        if (!ingredients.some(ing => ing.name.toLowerCase().includes(seasoning.name))) {
          ingredients.push(seasoning);
        }
      });
    }
    
    return ingredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantity || this.estimateQuantity(ing.name, preferences.servings),
      unit: ing.unit || this.suggestUnit(ing.name),
      category: ing.category || this.categorizeIngredient(ing.name),
      optional: ing.optional || false
    }));
  }

  /**
   * Generate cooking instructions
   */
  generateInstructions(ingredients, preferences, template) {
    const instructions = [];
    let stepNumber = 1;
    
    // Preparation steps
    const prepIngredients = ingredients.filter(ing => 
      ['vegetables', 'proteins'].includes(ing.category)
    );
    
    if (prepIngredients.length > 0) {
      instructions.push({
        step: stepNumber++,
        instruction: `Prepare ingredients: ${this.generatePrepInstructions(prepIngredients)}`,
        duration: 10
      });
    }
    
    // Cooking steps based on main ingredients
    const proteins = ingredients.filter(ing => ing.category === 'proteins');
    const vegetables = ingredients.filter(ing => ing.category === 'vegetables');
    
    if (proteins.length > 0) {
      instructions.push({
        step: stepNumber++,
        instruction: `Cook ${proteins[0].name}: ${this.generateCookingMethod(proteins[0])}`,
        duration: this.estimateCookingTime(proteins[0])
      });
    }
    
    if (vegetables.length > 0) {
      instructions.push({
        step: stepNumber++,
        instruction: `Add vegetables: ${this.generateVegetableCooking(vegetables)}`,
        duration: 8
      });
    }
    
    // Seasoning step
    const seasonings = ingredients.filter(ing => 
      ['spices', 'herbs', 'condiments'].includes(ing.category)
    );
    
    if (seasonings.length > 0) {
      instructions.push({
        step: stepNumber++,
        instruction: `Season with ${seasonings.map(s => s.name).join(', ')} to taste`,
        duration: 2
      });
    }
    
    // Final step
    instructions.push({
      step: stepNumber++,
      instruction: `Serve hot and enjoy!`,
      duration: 0
    });
    
    return instructions;
  }

  /**
   * Calculate recipe timing
   */
  calculateTiming(ingredients, instructions) {
    const prepTime = instructions
      .filter(inst => inst.step <= 2)
      .reduce((total, inst) => total + (inst.duration || 0), 0);
    
    const cookTime = instructions
      .filter(inst => inst.step > 2)
      .reduce((total, inst) => total + (inst.duration || 0), 0);
    
    return {
      prep: prepTime,
      cook: cookTime,
      total: prepTime + cookTime
    };
  }

  /**
   * Suggest equipment needed
   */
  suggestEquipment(instructions) {
    const equipment = ['knife', 'cutting board'];
    
    const instructionText = instructions.map(i => i.instruction).join(' ').toLowerCase();
    
    if (instructionText.includes('sauté') || instructionText.includes('fry')) {
      equipment.push('large skillet');
    }
    
    if (instructionText.includes('boil') || instructionText.includes('simmer')) {
      equipment.push('large pot');
    }
    
    if (instructionText.includes('bake') || instructionText.includes('roast')) {
      equipment.push('baking dish', 'oven');
    }
    
    if (instructionText.includes('grill')) {
      equipment.push('grill');
    }
    
    return [...new Set(equipment)]; // Remove duplicates
  }

  /**
   * Generate recipe tags
   */
  generateTags(ingredients, preferences) {
    const tags = [];
    
    // Add cuisine tag
    if (preferences.cuisine) {
      tags.push(preferences.cuisine);
    }
    
    // Add dietary restriction tags
    if (preferences.dietary_restrictions) {
      tags.push(...preferences.dietary_restrictions);
    }
    
    // Add ingredient-based tags
    const hasVegetables = ingredients.some(ing => ing.category === 'vegetables');
    const hasProteins = ingredients.some(ing => ing.category === 'proteins');
    
    if (hasVegetables && !hasProteins) {
      tags.push('vegetarian');
    }
    
    if (preferences.max_time <= 30) {
      tags.push('quick-meal');
    }
    
    if (preferences.budget_conscious) {
      tags.push('budget-friendly');
    }
    
    return tags;
  }

  /**
   * Helper methods
   */
  
  getIngredientComplexity(ingredient) {
    const complexityMap = {
      'salt': 1, 'pepper': 1, 'oil': 1,
      'onion': 2, 'garlic': 2, 'tomato': 2,
      'chicken': 3, 'beef': 3, 'fish': 3,
      'truffle': 5, 'saffron': 5, 'caviar': 5
    };
    
    return complexityMap[ingredient.toLowerCase()] || 2;
  }
  
  inferCuisineFromIngredients(ingredients) {
    const cuisineKeywords = {
      'italian': ['tomato', 'basil', 'parmesan', 'olive oil'],
      'chinese': ['soy sauce', 'ginger', 'rice'],
      'mexican': ['beans', 'corn', 'lime', 'cilantro'],
      'indian': ['curry', 'turmeric', 'cumin', 'lentils']
    };
    
    const ingredientNames = ingredients.map(i => i.name.toLowerCase());
    
    for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
      const matches = keywords.filter(keyword => 
        ingredientNames.some(name => name.includes(keyword))
      );
      
      if (matches.length >= 2) {
        return cuisine;
      }
    }
    
    return 'fusion';
  }
  
  suggestCookingMethods(ingredients) {
    const proteins = ingredients.filter(i => i.category === 'proteins');
    const vegetables = ingredients.filter(i => i.category === 'vegetables');
    
    const methods = [];
    
    if (proteins.length > 0) {
      methods.push('sautéing', 'grilling');
    }
    
    if (vegetables.length > 2) {
      methods.push('stir-frying', 'roasting');
    }
    
    return methods;
  }
  
  categorizeIngredient(ingredient) {
    // This would ideally use the same categorization as VisionService
    const categories = {
      vegetables: ['tomato', 'onion', 'carrot', 'broccoli', 'spinach'],
      proteins: ['chicken', 'beef', 'fish', 'eggs', 'tofu'],
      dairy: ['milk', 'cheese', 'yogurt', 'butter'],
      grains: ['rice', 'pasta', 'bread', 'quinoa'],
      spices: ['salt', 'pepper', 'cumin', 'paprika']
    };
    
    const name = ingredient.toLowerCase();
    
    for (const [category, items] of Object.entries(categories)) {
      if (items.some(item => name.includes(item))) {
        return category;
      }
    }
    
    return 'other';
  }
  
  estimateQuantity(ingredient, servings) {
    const baseQuantities = {
      'chicken': 6, 'beef': 6, 'fish': 6, // oz per serving
      'rice': 0.25, 'pasta': 2, // cups per serving
      'onion': 0.5, 'tomato': 1, // pieces per serving
      'oil': 1, 'butter': 1 // tbsp per serving
    };
    
    const baseQty = baseQuantities[ingredient.toLowerCase()] || 1;
    return baseQty * servings;
  }
  
  suggestUnit(ingredient) {
    const unitMap = {
      'chicken': 'pounds', 'beef': 'pounds', 'fish': 'pounds',
      'rice': 'cups', 'pasta': 'ounces',
      'onion': 'pieces', 'tomato': 'pieces',
      'oil': 'tablespoons', 'butter': 'tablespoons',
      'salt': 'teaspoons', 'pepper': 'teaspoons'
    };
    
    return unitMap[ingredient.toLowerCase()] || 'pieces';
  }
  
  generatePrepInstructions(ingredients) {
    const preps = ingredients.map(ing => {
      const name = ing.name.toLowerCase();
      if (name.includes('onion')) return 'dice onion';
      if (name.includes('tomato')) return 'chop tomatoes';
      if (name.includes('chicken')) return 'cut chicken into pieces';
      return `prepare ${ing.name}`;
    });
    
    return preps.join(', ');
  }
  
  generateCookingMethod(protein) {
    const methods = {
      'chicken': 'heat oil in pan, add chicken and cook for 6-8 minutes until golden',
      'beef': 'heat oil in pan, sear beef for 3-4 minutes per side',
      'fish': 'heat oil in pan, cook fish for 3-4 minutes per side',
      'eggs': 'scramble eggs in heated pan for 2-3 minutes'
    };
    
    return methods[protein.name.toLowerCase()] || `cook ${protein.name} until done`;
  }
  
  generateVegetableCooking(vegetables) {
    if (vegetables.length === 1) {
      return `add ${vegetables[0].name} and cook for 5-7 minutes`;
    }
    
    return `add ${vegetables.map(v => v.name).join(', ')} and cook for 5-7 minutes until tender`;
  }
  
  estimateCookingTime(ingredient) {
    const times = {
      'chicken': 15, 'beef': 12, 'fish': 8,
      'vegetables': 8, 'rice': 18, 'pasta': 12
    };
    
    return times[ingredient.category] || times[ingredient.name.toLowerCase()] || 10;
  }
  
  calculateNutrition(ingredients) {
    // Basic nutrition calculation - would be enhanced with real database
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    ingredients.forEach(ing => {
      const nutrition = this.getNutritionData(ing.name);
      if (nutrition) {
        const factor = ing.quantity || 1;
        totalCalories += nutrition.calories * factor;
        totalProtein += nutrition.protein * factor;
        totalCarbs += nutrition.carbs * factor;
        totalFat += nutrition.fat * factor;
      }
    });
    
    return {
      perServing: {
        calories: Math.round(totalCalories / 4),
        macros: {
          protein: Math.round(totalProtein / 4),
          carbs: Math.round(totalCarbs / 4),
          fat: Math.round(totalFat / 4)
        }
      },
      total: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat
      }
    };
  }
  
  calculateCost(ingredients, budgetMode) {
    let totalCost = 0;
    
    ingredients.forEach(ing => {
      const cost = this.getCostData(ing.name);
      if (cost) {
        totalCost += cost * (ing.quantity || 1);
      }
    });
    
    return {
      total: { estimated: totalCost, currency: 'USD' },
      perServing: totalCost / 4,
      budgetFriendly: totalCost < 15,
      breakdown: this.generateCostBreakdown(ingredients)
    };
  }
  
  generateCookingTips(recipe) {
    const tips = [
      'Taste and adjust seasoning before serving',
      'Have all ingredients prepped before starting to cook'
    ];
    
    if (recipe.ingredients.some(ing => ing.category === 'proteins')) {
      tips.push('Let meat rest for a few minutes after cooking');
    }
    
    if (recipe.timing.total > 45) {
      tips.push('This recipe can be partially prepared ahead of time');
    }
    
    return tips;
  }
  
  generateSubstitutions(ingredients) {
    const substitutions = {};
    
    ingredients.forEach(ing => {
      const subs = this.getSubstitutions(ing.name);
      if (subs.length > 0) {
        substitutions[ing.name] = subs;
      }
    });
    
    return substitutions;
  }
  
  explainDifficulty(recipe) {
    const level = recipe.difficulty;
    const explanations = {
      'easy': 'Simple techniques, common ingredients, minimal prep time',
      'medium': 'Some cooking experience helpful, moderate prep and timing',
      'hard': 'Advanced techniques required, precise timing important'
    };
    
    return explanations[level] || 'Standard cooking difficulty';
  }
  
  getSeasonalInfo(ingredients) {
    const seasonal = [];
    
    ingredients.forEach(ing => {
      const seasons = this.getIngredientSeasons(ing.name);
      seasonal.push(...seasons);
    });
    
    return [...new Set(seasonal)];
  }
  
  // Mock data methods (would connect to real databases in production)
  getNutritionData(ingredient) {
    const nutritionDB = {
      'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      'beef': { calories: 250, protein: 26, carbs: 0, fat: 15 },
      'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }
    };
    
    return nutritionDB[ingredient.toLowerCase()];
  }
  
  getCostData(ingredient) {
    const costDB = {
      'chicken': 2.50, 'beef': 4.00, 'fish': 3.50,
      'rice': 0.50, 'pasta': 0.75,
      'onion': 0.25, 'tomato': 0.50
    };
    
    return costDB[ingredient.toLowerCase()] || 1.00;
  }
  
  generateCostBreakdown(ingredients) {
    const breakdown = [];
    const categories = {};
    
    ingredients.forEach(ing => {
      const category = ing.category;
      const cost = this.getCostData(ing.name) * (ing.quantity || 1);
      categories[category] = (categories[category] || 0) + cost;
    });
    
    const total = Object.values(categories).reduce((sum, cost) => sum + cost, 0);
    
    Object.entries(categories).forEach(([category, cost]) => {
      breakdown.push({
        category,
        amount: cost,
        percentage: Math.round((cost / total) * 100)
      });
    });
    
    return breakdown;
  }
  
  getSubstitutions(ingredient) {
    const substitutionDB = {
      'chicken': ['turkey', 'tofu'],
      'beef': ['turkey', 'mushrooms'],
      'milk': ['almond milk', 'oat milk'],
      'butter': ['olive oil', 'coconut oil']
    };
    
    return substitutionDB[ingredient.toLowerCase()] || [];
  }
  
  getIngredientSeasons(ingredient) {
    const seasonDB = {
      'tomato': ['summer'],
      'apple': ['fall'],
      'asparagus': ['spring'],
      'squash': ['fall', 'winter']
    };
    
    return seasonDB[ingredient.toLowerCase()] || [];
  }
  
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = new AIService();