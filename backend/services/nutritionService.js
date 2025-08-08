/**
 * Nutrition Service
 * 
 * Comprehensive nutrition analysis service for calculating detailed
 * nutritional information, health scores, and dietary compliance
 * for recipes and ingredients.
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class NutritionService {
  constructor() {
    this.initialized = false;
    this.nutritionDatabase = new Map();
    this.supplementsDatabase = new Map();
    this.allergenDatabase = new Map();
    
    // USDA nutrition database (simplified version)
    this.usdaDatabase = new Map();
    
    // RDA (Recommended Daily Allowances) for adults
    this.rda = {
      calories: 2000,
      protein: 50,      // grams
      carbs: 300,       // grams
      fat: 65,          // grams
      fiber: 25,        // grams
      sugar: 50,        // grams (max recommended)
      sodium: 2300,     // milligrams (max recommended)
      cholesterol: 300, // milligrams (max recommended)
      potassium: 3500,  // milligrams
      calcium: 1000,    // milligrams
      iron: 18,         // milligrams
      vitaminA: 900,    // micrograms
      vitaminC: 90,     // milligrams
      vitaminD: 20,     // micrograms
      vitaminE: 15,     // milligrams
      vitaminK: 120,    // micrograms
      vitaminB6: 1.3,   // milligrams
      vitaminB12: 2.4,  // micrograms
      folate: 400,      // micrograms
      niacin: 16,       // milligrams
      riboflavin: 1.3,  // milligrams
      thiamin: 1.2      // milligrams
    };
    
    // Initialize nutrition profiles for different dietary patterns
    this.dietaryProfiles = new Map();
    this.initializeDietaryProfiles();
  }

  /**
   * Initialize the nutrition service
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Nutrition Service...');
      
      // Load nutrition databases
      await this.loadNutritionDatabase();
      await this.loadAllergenDatabase();
      await this.loadSupplementsDatabase();
      
      this.initialized = true;
      console.log('✅ Nutrition Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Nutrition Service:', error.message);
      throw new Error(`Nutrition Service initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize dietary profiles
   */
  initializeDietaryProfiles() {
    this.dietaryProfiles.set('standard', {
      macroRatios: { protein: 20, carbs: 50, fat: 30 },
      restrictions: [],
      emphasis: ['balanced'],
      maxSodium: 2300,
      maxSugar: 50
    });
    
    this.dietaryProfiles.set('keto', {
      macroRatios: { protein: 25, carbs: 5, fat: 70 },
      restrictions: ['high-carb'],
      emphasis: ['low-carb', 'high-fat'],
      maxSodium: 2300,
      maxCarbs: 20
    });
    
    this.dietaryProfiles.set('paleo', {
      macroRatios: { protein: 30, carbs: 30, fat: 40 },
      restrictions: ['grains', 'dairy', 'legumes', 'processed'],
      emphasis: ['whole-foods', 'natural'],
      maxSodium: 1500
    });
    
    this.dietaryProfiles.set('mediterranean', {
      macroRatios: { protein: 20, carbs: 45, fat: 35 },
      restrictions: [],
      emphasis: ['olive-oil', 'fish', 'vegetables', 'whole-grains'],
      maxSodium: 1500
    });
    
    this.dietaryProfiles.set('vegan', {
      macroRatios: { protein: 15, carbs: 60, fat: 25 },
      restrictions: ['animal-products'],
      emphasis: ['plant-based', 'fiber'],
      minFiber: 35
    });
    
    this.dietaryProfiles.set('vegetarian', {
      macroRatios: { protein: 18, carbs: 55, fat: 27 },
      restrictions: ['meat', 'fish'],
      emphasis: ['plant-based', 'dairy'],
      minFiber: 30
    });
  }

  /**
   * Load comprehensive nutrition database
   */
  async loadNutritionDatabase() {
    // Comprehensive nutrition database with detailed micronutrients
    const nutritionData = [
      // Proteins
      {
        name: 'chicken breast',
        per100g: {
          calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0,
          sodium: 74, cholesterol: 85, potassium: 256, calcium: 15,
          iron: 0.9, vitaminA: 21, vitaminC: 0, vitaminD: 0.2,
          vitaminE: 0.3, vitaminK: 0.4, vitaminB6: 0.5, vitaminB12: 0.3,
          folate: 4, niacin: 10.9, riboflavin: 0.1, thiamin: 0.1,
          magnesium: 25, phosphorus: 196, zinc: 0.9, selenium: 22.0
        }
      },
      {
        name: 'salmon',
        per100g: {
          calories: 208, protein: 25.4, carbs: 0, fat: 12.4, fiber: 0,
          sodium: 59, cholesterol: 55, potassium: 363, calcium: 9,
          iron: 0.3, vitaminA: 12, vitaminC: 0, vitaminD: 11.1,
          vitaminE: 1.2, vitaminK: 0.1, vitaminB6: 0.6, vitaminB12: 2.8,
          folate: 26, niacin: 8.5, riboflavin: 0.1, thiamin: 0.2,
          omega3: 2.3, magnesium: 27, phosphorus: 252, zinc: 0.4
        }
      },
      {
        name: 'eggs',
        per100g: {
          calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0,
          sodium: 124, cholesterol: 373, potassium: 126, calcium: 50,
          iron: 1.2, vitaminA: 160, vitaminC: 0, vitaminD: 2.0,
          vitaminE: 1.0, vitaminK: 0.3, vitaminB6: 0.1, vitaminB12: 1.1,
          folate: 44, niacin: 0.1, riboflavin: 0.5, thiamin: 0.1,
          choline: 294, biotin: 20.2, lutein: 503
        }
      },
      
      // Vegetables
      {
        name: 'broccoli',
        per100g: {
          calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6,
          sodium: 33, cholesterol: 0, potassium: 316, calcium: 47,
          iron: 0.7, vitaminA: 31, vitaminC: 89.2, vitaminD: 0,
          vitaminE: 0.8, vitaminK: 101.6, vitaminB6: 0.2, vitaminB12: 0,
          folate: 63, niacin: 0.6, riboflavin: 0.1, thiamin: 0.1,
          antioxidants: 'high', phytochemicals: ['sulforaphane', 'glucosinolates']
        }
      },
      {
        name: 'spinach',
        per100g: {
          calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2,
          sodium: 79, cholesterol: 0, potassium: 558, calcium: 99,
          iron: 2.7, vitaminA: 469, vitaminC: 28.1, vitaminD: 0,
          vitaminE: 2.0, vitaminK: 483, vitaminB6: 0.2, vitaminB12: 0,
          folate: 194, niacin: 0.7, riboflavin: 0.2, thiamin: 0.1,
          lutein: 12198, betaCarotene: 5626, oxalates: 970
        }
      },
      {
        name: 'tomato',
        per100g: {
          calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2,
          sodium: 5, cholesterol: 0, potassium: 237, calcium: 10,
          iron: 0.3, vitaminA: 42, vitaminC: 13.7, vitaminD: 0,
          vitaminE: 0.5, vitaminK: 7.9, vitaminB6: 0.1, vitaminB12: 0,
          folate: 15, niacin: 0.6, riboflavin: 0.0, thiamin: 0.0,
          lycopene: 2573, betaCarotene: 449
        }
      },
      
      // Fruits
      {
        name: 'banana',
        per100g: {
          calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6,
          sodium: 1, cholesterol: 0, potassium: 358, calcium: 5,
          iron: 0.3, vitaminA: 3, vitaminC: 8.7, vitaminD: 0,
          vitaminE: 0.1, vitaminK: 0.5, vitaminB6: 0.4, vitaminB12: 0,
          folate: 20, niacin: 0.7, riboflavin: 0.1, thiamin: 0.0,
          naturalSugars: 12.2, starch: 5.4
        }
      },
      {
        name: 'blueberries',
        per100g: {
          calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4,
          sodium: 1, cholesterol: 0, potassium: 77, calcium: 6,
          iron: 0.3, vitaminA: 3, vitaminC: 9.7, vitaminD: 0,
          vitaminE: 0.6, vitaminK: 19.3, vitaminB6: 0.1, vitaminB12: 0,
          folate: 6, niacin: 0.4, riboflavin: 0.0, thiamin: 0.0,
          anthocyanins: 163, antioxidants: 'very-high'
        }
      },
      
      // Grains
      {
        name: 'brown rice',
        per100g: {
          calories: 112, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8,
          sodium: 7, cholesterol: 0, potassium: 43, calcium: 3,
          iron: 0.4, vitaminA: 0, vitaminC: 0, vitaminD: 0,
          vitaminE: 0.1, vitaminK: 0.1, vitaminB6: 0.1, vitaminB12: 0,
          folate: 4, niacin: 1.5, riboflavin: 0.0, thiamin: 0.1,
          glycemicIndex: 50, arsenic: 'trace'
        }
      },
      {
        name: 'quinoa',
        per100g: {
          calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8,
          sodium: 7, cholesterol: 0, potassium: 172, calcium: 17,
          iron: 1.5, vitaminA: 1, vitaminC: 0, vitaminD: 0,
          vitaminE: 0.6, vitaminK: 0.0, vitaminB6: 0.1, vitaminB12: 0,
          folate: 42, niacin: 0.4, riboflavin: 0.1, thiamin: 0.1,
          completeProtein: true, saponins: 'low'
        }
      },
      
      // Dairy
      {
        name: 'greek yogurt',
        per100g: {
          calories: 97, protein: 10, carbs: 3.98, fat: 5, fiber: 0,
          sodium: 36, cholesterol: 10, potassium: 141, calcium: 115,
          iron: 0.0, vitaminA: 27, vitaminC: 0.8, vitaminD: 0,
          vitaminE: 0.0, vitaminK: 0.2, vitaminB6: 0.1, vitaminB12: 0.5,
          folate: 7, niacin: 0.2, riboflavin: 0.3, thiamin: 0.0,
          probiotics: ['lactobacillus', 'streptococcus']
        }
      },
      
      // Nuts and Seeds
      {
        name: 'almonds',
        per100g: {
          calories: 576, protein: 21.2, carbs: 21.7, fat: 49.4, fiber: 12.2,
          sodium: 1, cholesterol: 0, potassium: 705, calcium: 264,
          iron: 3.7, vitaminA: 1, vitaminC: 0, vitaminD: 0,
          vitaminE: 26.2, vitaminK: 0.0, vitaminB6: 0.1, vitaminB12: 0,
          folate: 29, niacin: 3.4, riboflavin: 1.0, thiamin: 0.2,
          healthyFats: 'monounsaturated', phyticAcid: 'moderate'
        }
      }
    ];
    
    // Load into database
    nutritionData.forEach(item => {
      this.nutritionDatabase.set(item.name.toLowerCase(), item.per100g);
    });
    
    console.log(`📊 Loaded ${nutritionData.length} nutrition profiles`);
  }

  /**
   * Load allergen database
   */
  async loadAllergenDatabase() {
    const allergenData = {
      'milk': ['dairy', 'lactose', 'casein', 'whey'],
      'eggs': ['egg-white', 'egg-yolk', 'albumin'],
      'fish': ['finfish'],
      'shellfish': ['crustacean', 'mollusk'],
      'tree-nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio'],
      'peanuts': ['groundnut', 'arachis'],
      'wheat': ['gluten', 'gliadin'],
      'soy': ['soybean', 'lecithin'],
      'sesame': ['tahini', 'sesame-oil']
    };
    
    Object.entries(allergenData).forEach(([allergen, variants]) => {
      this.allergenDatabase.set(allergen, variants);
    });
    
    console.log(`🚨 Loaded ${Object.keys(allergenData).length} allergen profiles`);
  }

  /**
   * Load supplements database
   */
  async loadSupplementsDatabase() {
    const supplementsData = {
      'vitamin-d': { rda: 20, deficiencyRisk: 'high', foodSources: ['fatty-fish', 'fortified-milk'] },
      'vitamin-b12': { rda: 2.4, deficiencyRisk: 'high-vegan', foodSources: ['meat', 'fish', 'dairy'] },
      'iron': { rda: 18, deficiencyRisk: 'medium', foodSources: ['red-meat', 'spinach', 'lentils'] },
      'omega-3': { rda: 1.6, deficiencyRisk: 'medium', foodSources: ['fish', 'flax', 'walnuts'] },
      'calcium': { rda: 1000, deficiencyRisk: 'medium', foodSources: ['dairy', 'leafy-greens'] }
    };
    
    Object.entries(supplementsData).forEach(([supplement, data]) => {
      this.supplementsDatabase.set(supplement, data);
    });
  }

  /**
   * Analyze recipe nutrition
   */
  async analyzeRecipeNutrition(recipe, servings = 4) {
    if (!this.initialized) {
      throw new Error('Nutrition service not initialized');
    }

    try {
      console.log('🧮 Analyzing recipe nutrition...');
      
      // Calculate nutrition for all ingredients
      const ingredientNutrition = await this.calculateIngredientsNutrition(recipe.ingredients);
      
      // Calculate per-serving nutrition
      const perServingNutrition = this.calculatePerServingNutrition(ingredientNutrition, servings);
      
      // Calculate health score
      const healthScore = this.calculateHealthScore(perServingNutrition, recipe.ingredients);
      
      // Determine dietary flags
      const dietaryFlags = this.determineDietaryFlags(recipe.ingredients);
      
      // Identify allergens
      const allergens = this.identifyAllergens(recipe.ingredients);
      
      // Calculate nutritional completeness
      const completeness = this.calculateNutritionalCompleteness(perServingNutrition);
      
      // Generate nutrition recommendations
      const recommendations = this.generateNutritionRecommendations(perServingNutrition, recipe.ingredients);
      
      const analysis = {
        perServing: perServingNutrition,
        total: ingredientNutrition,
        healthScore: healthScore,
        dietaryFlags: dietaryFlags,
        allergens: allergens,
        completeness: completeness,
        recommendations: recommendations,
        macroBreakdown: this.calculateMacroBreakdown(perServingNutrition),
        micronutrientProfile: this.calculateMicronutrientProfile(perServingNutrition),
        rdaPercentages: this.calculateRDAPercentages(perServingNutrition),
        antioxidantScore: this.calculateAntioxidantScore(recipe.ingredients),
        inflammatoryIndex: this.calculateInflammatoryIndex(recipe.ingredients),
        glycemicLoad: this.calculateGlycemicLoad(recipe.ingredients),
        nutritionLabel: this.generateNutritionLabel(perServingNutrition),
        calculatedAt: new Date(),
        source: 'comprehensive-analysis'
      };
      
      console.log(`✅ Nutrition analysis complete - Health Score: ${healthScore}/100`);
      return analysis;
      
    } catch (error) {
      console.error('❌ Error analyzing nutrition:', error.message);
      throw new Error(`Nutrition analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate nutrition for all ingredients
   */
  async calculateIngredientsNutrition(ingredients) {
    const totalNutrition = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      sodium: 0, cholesterol: 0, potassium: 0, calcium: 0,
      iron: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0,
      vitaminE: 0, vitaminK: 0, vitaminB6: 0, vitaminB12: 0,
      folate: 0, niacin: 0, riboflavin: 0, thiamin: 0,
      magnesium: 0, phosphorus: 0, zinc: 0, selenium: 0,
      omega3: 0, antioxidants: 0
    };
    
    for (const ingredient of ingredients) {
      const nutrition = await this.getIngredientNutrition(ingredient);
      
      if (nutrition) {
        // Convert quantity to grams
        const gramsAmount = this.convertToGrams(ingredient.quantity || 1, ingredient.unit || 'pieces', ingredient.name);
        const factor = gramsAmount / 100; // nutrition data is per 100g
        
        // Add to total
        Object.keys(totalNutrition).forEach(nutrient => {
          if (nutrition[nutrient] !== undefined) {
            totalNutrition[nutrient] += nutrition[nutrient] * factor;
          }
        });
      }
    }
    
    return totalNutrition;
  }

  /**
   * Get nutrition data for a single ingredient
   */
  async getIngredientNutrition(ingredient) {
    const name = ingredient.name.toLowerCase();
    
    // Try exact match first
    if (this.nutritionDatabase.has(name)) {
      return this.nutritionDatabase.get(name);
    }
    
    // Try partial match
    for (const [key, nutrition] of this.nutritionDatabase.entries()) {
      if (name.includes(key) || key.includes(name)) {
        return nutrition;
      }
    }
    
    // Try external API if available
    if (process.env.NUTRITIONIX_API_KEY) {
      try {
        return await this.fetchNutritionFromAPI(ingredient);
      } catch (error) {
        console.warn(`⚠️ Could not fetch nutrition for ${name}:`, error.message);
      }
    }
    
    // Return default nutrition estimate
    return this.getDefaultNutritionEstimate(ingredient);
  }

  /**
   * Fetch nutrition from external API
   */
  async fetchNutritionFromAPI(ingredient) {
    const response = await axios.post('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      query: `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`
    }, {
      headers: {
        'x-app-id': process.env.NUTRITIONIX_APP_ID,
        'x-app-key': process.env.NUTRITIONIX_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const food = response.data.foods[0];
    
    return {
      calories: food.nf_calories,
      protein: food.nf_protein,
      carbs: food.nf_total_carbohydrate,
      fat: food.nf_total_fat,
      fiber: food.nf_dietary_fiber,
      sodium: food.nf_sodium,
      cholesterol: food.nf_cholesterol,
      potassium: food.nf_potassium,
      // Add more nutrients as available from API
    };
  }

  /**
   * Calculate per-serving nutrition
   */
  calculatePerServingNutrition(totalNutrition, servings) {
    const perServing = {};
    
    Object.entries(totalNutrition).forEach(([nutrient, value]) => {
      perServing[nutrient] = Math.round((value / servings) * 100) / 100; // Round to 2 decimal places
    });
    
    return perServing;
  }

  /**
   * Calculate health score (0-100)
   */
  calculateHealthScore(nutrition, ingredients) {
    let score = 50; // Base score
    
    // Positive factors
    if (nutrition.fiber > 5) score += 10;
    if (nutrition.protein > 15) score += 10;
    if (nutrition.vitaminC > 15) score += 5;
    if (nutrition.vitaminA > 100) score += 5;
    if (nutrition.omega3 > 0.5) score += 10;
    
    // Vegetable/fruit content
    const plantFoods = ingredients.filter(ing => 
      ['vegetables', 'fruits'].includes(ing.category)
    ).length;
    score += Math.min(plantFoods * 3, 15);
    
    // Negative factors
    if (nutrition.sodium > 800) score -= 10;
    if (nutrition.cholesterol > 100) score -= 5;
    if (nutrition.calories > 600) score -= 5;
    
    // Processed food penalty
    const processedFoods = ingredients.filter(ing => 
      ing.name.toLowerCase().includes('processed') ||
      ing.name.toLowerCase().includes('canned') ||
      ing.name.toLowerCase().includes('frozen')
    ).length;
    score -= processedFoods * 3;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine dietary flags
   */
  determineDietaryFlags(ingredients) {
    const flags = [];
    
    const hasAnimalProducts = ingredients.some(ing => 
      ['proteins', 'dairy'].includes(ing.category) &&
      !['tofu', 'tempeh', 'plant'].some(term => ing.name.toLowerCase().includes(term))
    );
    
    const hasMeat = ingredients.some(ing => 
      ing.category === 'proteins' &&
      ['chicken', 'beef', 'pork', 'lamb', 'fish'].some(meat => 
        ing.name.toLowerCase().includes(meat)
      )
    );
    
    const hasGluten = ingredients.some(ing => 
      ['wheat', 'flour', 'bread', 'pasta'].some(gluten => 
        ing.name.toLowerCase().includes(gluten)
      )
    );
    
    const hasDairy = ingredients.some(ing => 
      ing.category === 'dairy' ||
      ['milk', 'cheese', 'yogurt', 'butter'].some(dairy => 
        ing.name.toLowerCase().includes(dairy)
      )
    );
    
    const hasNuts = ingredients.some(ing => 
      ing.category === 'nuts' ||
      ['almond', 'walnut', 'peanut', 'cashew'].some(nut => 
        ing.name.toLowerCase().includes(nut)
      )
    );
    
    // Determine flags
    if (!hasAnimalProducts) flags.push('vegan');
    if (!hasMeat) flags.push('vegetarian');
    if (!hasGluten) flags.push('gluten-free');
    if (!hasDairy) flags.push('dairy-free');
    if (!hasNuts) flags.push('nut-free');
    
    return flags;
  }

  /**
   * Identify allergens
   */
  identifyAllergens(ingredients) {
    const allergens = [];
    
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      
      this.allergenDatabase.forEach((variants, allergen) => {
        if (variants.some(variant => name.includes(variant.toLowerCase()))) {
          if (!allergens.includes(allergen)) {
            allergens.push(allergen);
          }
        }
      });
    });
    
    return allergens;
  }

  /**
   * Calculate nutritional completeness
   */
  calculateNutritionalCompleteness(nutrition) {
    const completeness = {};
    const rdaKeys = [
      'protein', 'fiber', 'vitaminA', 'vitaminC', 'vitaminD',
      'calcium', 'iron', 'potassium'
    ];
    
    rdaKeys.forEach(nutrient => {
      if (this.rda[nutrient] && nutrition[nutrient] !== undefined) {
        const percentage = (nutrition[nutrient] / this.rda[nutrient]) * 100;
        completeness[nutrient] = {
          amount: nutrition[nutrient],
          rda: this.rda[nutrient],
          percentage: Math.round(percentage),
          adequate: percentage >= 25 // 25% of RDA per meal is considered adequate
        };
      }
    });
    
    const overallScore = Object.values(completeness)
      .reduce((sum, item) => sum + Math.min(item.percentage, 100), 0) / rdaKeys.length;
    
    return {
      nutrients: completeness,
      overallScore: Math.round(overallScore),
      rating: this.getCompletenessRating(overallScore)
    };
  }

  /**
   * Generate nutrition recommendations
   */
  generateNutritionRecommendations(nutrition, ingredients) {
    const recommendations = [];
    
    // Fiber recommendation
    if (nutrition.fiber < 5) {
      recommendations.push({
        type: 'increase',
        nutrient: 'fiber',
        suggestion: 'Add more vegetables, fruits, or whole grains',
        priority: 'medium'
      });
    }
    
    // Sodium warning
    if (nutrition.sodium > 800) {
      recommendations.push({
        type: 'reduce',
        nutrient: 'sodium',
        suggestion: 'Reduce salt and processed ingredients',
        priority: 'high'
      });
    }
    
    // Protein adequacy
    if (nutrition.protein < 15) {
      recommendations.push({
        type: 'increase',
        nutrient: 'protein',
        suggestion: 'Add lean protein sources like chicken, fish, or legumes',
        priority: 'medium'
      });
    }
    
    // Vitamin C
    if (nutrition.vitaminC < 15) {
      recommendations.push({
        type: 'increase',
        nutrient: 'vitamin C',
        suggestion: 'Include citrus fruits, berries, or bell peppers',
        priority: 'low'
      });
    }
    
    // Healthy fats
    if (nutrition.omega3 < 0.3) {
      recommendations.push({
        type: 'increase',
        nutrient: 'omega-3',
        suggestion: 'Add fatty fish, walnuts, or flax seeds',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate macro breakdown percentages
   */
  calculateMacroBreakdown(nutrition) {
    const proteinCals = nutrition.protein * 4;
    const carbCals = nutrition.carbs * 4;
    const fatCals = nutrition.fat * 9;
    const totalCals = proteinCals + carbCals + fatCals;
    
    if (totalCals === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: Math.round((proteinCals / totalCals) * 100),
      carbs: Math.round((carbCals / totalCals) * 100),
      fat: Math.round((fatCals / totalCals) * 100)
    };
  }

  /**
   * Calculate micronutrient profile
   */
  calculateMicronutrientProfile(nutrition) {
    const micronutrients = {
      excellent: [], // >50% RDA
      good: [],      // 25-50% RDA
      adequate: [],  // 10-25% RDA
      low: []        // <10% RDA
    };
    
    const microKeys = [
      'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
      'calcium', 'iron', 'potassium', 'magnesium', 'zinc'
    ];
    
    microKeys.forEach(nutrient => {
      if (this.rda[nutrient] && nutrition[nutrient] !== undefined) {
        const percentage = (nutrition[nutrient] / this.rda[nutrient]) * 100;
        
        if (percentage >= 50) micronutrients.excellent.push(nutrient);
        else if (percentage >= 25) micronutrients.good.push(nutrient);
        else if (percentage >= 10) micronutrients.adequate.push(nutrient);
        else micronutrients.low.push(nutrient);
      }
    });
    
    return micronutrients;
  }

  /**
   * Calculate RDA percentages
   */
  calculateRDAPercentages(nutrition) {
    const percentages = {};
    
    Object.keys(this.rda).forEach(nutrient => {
      if (nutrition[nutrient] !== undefined) {
        percentages[nutrient] = Math.round((nutrition[nutrient] / this.rda[nutrient]) * 100);
      }
    });
    
    return percentages;
  }

  /**
   * Calculate antioxidant score
   */
  calculateAntioxidantScore(ingredients) {
    const antioxidantFoods = {
      'blueberries': 10, 'spinach': 8, 'broccoli': 7,
      'tomato': 6, 'green tea': 9, 'dark chocolate': 8,
      'nuts': 6, 'berries': 9, 'leafy greens': 7
    };
    
    let score = 0;
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      Object.entries(antioxidantFoods).forEach(([food, points]) => {
        if (name.includes(food)) {
          score += points;
        }
      });
    });
    
    return Math.min(score, 50); // Cap at 50
  }

  /**
   * Calculate inflammatory index
   */
  calculateInflammatoryIndex(ingredients) {
    const antiInflammatory = {
      'salmon': -3, 'turmeric': -4, 'ginger': -3,
      'leafy greens': -2, 'berries': -2, 'nuts': -1
    };
    
    const proInflammatory = {
      'processed meat': 3, 'sugar': 2, 'refined flour': 2,
      'trans fat': 4, 'fried foods': 3
    };
    
    let index = 0;
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      
      Object.entries(antiInflammatory).forEach(([food, score]) => {
        if (name.includes(food)) index += score;
      });
      
      Object.entries(proInflammatory).forEach(([food, score]) => {
        if (name.includes(food)) index += score;
      });
    });
    
    return index;
  }

  /**
   * Calculate glycemic load
   */
  calculateGlycemicLoad(ingredients) {
    const glycemicIndex = {
      'white rice': 70, 'brown rice': 50, 'quinoa': 35,
      'white bread': 75, 'whole wheat bread': 55,
      'potato': 80, 'sweet potato': 45, 'oats': 40
    };
    
    let totalGL = 0;
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      Object.entries(glycemicIndex).forEach(([food, gi]) => {
        if (name.includes(food)) {
          // Simplified GL calculation
          const carbGrams = this.estimateCarbGrams(ingredient);
          totalGL += (gi * carbGrams) / 100;
        }
      });
    });
    
    return Math.round(totalGL);
  }

  /**
   * Generate nutrition label
   */
  generateNutritionLabel(nutrition) {
    return {
      servingSize: "1 serving",
      calories: Math.round(nutrition.calories),
      totalFat: `${Math.round(nutrition.fat)}g`,
      saturatedFat: `${Math.round(nutrition.fat * 0.3)}g`, // Estimate
      cholesterol: `${Math.round(nutrition.cholesterol)}mg`,
      sodium: `${Math.round(nutrition.sodium)}mg`,
      totalCarbs: `${Math.round(nutrition.carbs)}g`,
      dietaryFiber: `${Math.round(nutrition.fiber)}g`,
      totalSugars: `${Math.round(nutrition.carbs * 0.4)}g`, // Estimate
      protein: `${Math.round(nutrition.protein)}g`,
      vitaminA: `${Math.round(nutrition.vitaminA)}mcg`,
      vitaminC: `${Math.round(nutrition.vitaminC)}mg`,
      calcium: `${Math.round(nutrition.calcium)}mg`,
      iron: `${Math.round(nutrition.iron)}mg`
    };
  }

  /**
   * Helper methods
   */
  
  convertToGrams(quantity, unit, ingredient) {
    const conversions = {
      // Volume to weight conversions (approximate)
      'cup': { 'rice': 200, 'flour': 120, 'sugar': 200, 'milk': 240 },
      'tablespoon': { 'oil': 14, 'butter': 14, 'sugar': 12 },
      'teaspoon': { 'salt': 6, 'sugar': 4, 'oil': 5 },
      // Weight conversions
      'pound': 454, 'ounce': 28, 'gram': 1, 'kilogram': 1000,
      // Piece conversions (very approximate)
      'piece': { 'chicken breast': 150, 'egg': 50, 'apple': 180 }
    };
    
    const name = ingredient.toLowerCase();
    
    if (unit === 'grams' || unit === 'gram') {
      return quantity;
    }
    
    if (conversions[unit]) {
      if (typeof conversions[unit] === 'number') {
        return quantity * conversions[unit];
      } else {
        // Look for ingredient-specific conversion
        for (const [key, value] of Object.entries(conversions[unit])) {
          if (name.includes(key)) {
            return quantity * value;
          }
        }
        // Default conversion
        return quantity * 100;
      }
    }
    
    // Default to 100g per serving if unknown
    return quantity * 100;
  }
  
  getDefaultNutritionEstimate(ingredient) {
    const category = ingredient.category || 'other';
    
    const defaults = {
      'proteins': { calories: 150, protein: 25, carbs: 0, fat: 5 },
      'vegetables': { calories: 25, protein: 2, carbs: 5, fat: 0, fiber: 3 },
      'fruits': { calories: 50, protein: 1, carbs: 12, fat: 0, fiber: 2 },
      'grains': { calories: 130, protein: 4, carbs: 25, fat: 1, fiber: 3 },
      'dairy': { calories: 100, protein: 8, carbs: 5, fat: 5, calcium: 150 },
      'nuts': { calories: 200, protein: 6, carbs: 6, fat: 18, fiber: 3 }
    };
    
    return defaults[category] || { calories: 50, protein: 2, carbs: 8, fat: 1 };
  }
  
  getCompletenessRating(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'adequate';
    return 'needs-improvement';
  }
  
  estimateCarbGrams(ingredient) {
    const nutrition = this.getDefaultNutritionEstimate(ingredient);
    const grams = this.convertToGrams(ingredient.quantity || 1, ingredient.unit || 'pieces', ingredient.name);
    return (nutrition.carbs || 0) * (grams / 100);
  }

  /**
   * Analyze dietary compatibility
   */
  analyzeDietaryCompatibility(nutrition, dietaryProfile) {
    const profile = this.dietaryProfiles.get(dietaryProfile);
    if (!profile) {
      throw new Error(`Unknown dietary profile: ${dietaryProfile}`);
    }
    
    const macroBreakdown = this.calculateMacroBreakdown(nutrition);
    const compatibility = {
      compatible: true,
      score: 100,
      issues: [],
      recommendations: []
    };
    
    // Check macro ratios
    const proteinDiff = Math.abs(macroBreakdown.protein - profile.macroRatios.protein);
    const carbDiff = Math.abs(macroBreakdown.carbs - profile.macroRatios.carbs);
    const fatDiff = Math.abs(macroBreakdown.fat - profile.macroRatios.fat);
    
    if (proteinDiff > 10) {
      compatibility.score -= proteinDiff;
      compatibility.issues.push(`Protein ratio (${macroBreakdown.protein}%) differs from ${dietaryProfile} target (${profile.macroRatios.protein}%)`);
    }
    
    if (carbDiff > 15) {
      compatibility.score -= carbDiff;
      compatibility.issues.push(`Carb ratio (${macroBreakdown.carbs}%) differs from ${dietaryProfile} target (${profile.macroRatios.carbs}%)`);
    }
    
    // Check specific restrictions
    if (profile.maxSodium && nutrition.sodium > profile.maxSodium) {
      compatibility.score -= 20;
      compatibility.issues.push(`Sodium content (${nutrition.sodium}mg) exceeds ${dietaryProfile} limit (${profile.maxSodium}mg)`);
    }
    
    if (profile.maxCarbs && nutrition.carbs > profile.maxCarbs) {
      compatibility.score -= 30;
      compatibility.issues.push(`Carb content (${nutrition.carbs}g) exceeds ${dietaryProfile} limit (${profile.maxCarbs}g)`);
    }
    
    if (profile.minFiber && nutrition.fiber < profile.minFiber) {
      compatibility.score -= 15;
      compatibility.issues.push(`Fiber content (${nutrition.fiber}g) below ${dietaryProfile} minimum (${profile.minFiber}g)`);
    }
    
    compatibility.compatible = compatibility.score >= 70;
    compatibility.score = Math.max(0, compatibility.score);
    
    return compatibility;
  }

  /**
   * Generate meal plan nutrition summary
   */
  generateMealPlanSummary(meals) {
    const dailyTotals = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      sodium: 0, vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0
    };
    
    meals.forEach(meal => {
      if (meal.nutrition && meal.nutrition.perServing) {
        Object.keys(dailyTotals).forEach(nutrient => {
          dailyTotals[nutrient] += meal.nutrition.perServing[nutrient] || 0;
        });
      }
    });
    
    const rdaPercentages = this.calculateRDAPercentages(dailyTotals);
    const macroBreakdown = this.calculateMacroBreakdown(dailyTotals);
    
    return {
      dailyTotals,
      rdaPercentages,
      macroBreakdown,
      adequacy: this.assessDailyAdequacy(rdaPercentages),
      recommendations: this.generateDailyRecommendations(dailyTotals, rdaPercentages)
    };
  }
  
  assessDailyAdequacy(rdaPercentages) {
    const keyNutrients = ['protein', 'fiber', 'vitaminA', 'vitaminC', 'calcium', 'iron'];
    const adequate = keyNutrients.filter(nutrient => rdaPercentages[nutrient] >= 80);
    
    return {
      score: (adequate.length / keyNutrients.length) * 100,
      adequate: adequate,
      deficient: keyNutrients.filter(nutrient => rdaPercentages[nutrient] < 50)
    };
  }
  
  generateDailyRecommendations(totals, percentages) {
    const recommendations = [];
    
    if (percentages.fiber < 80) {
      recommendations.push('Increase fiber intake with more whole grains, fruits, and vegetables');
    }
    
    if (percentages.vitaminC < 80) {
      recommendations.push('Add citrus fruits, berries, or bell peppers for vitamin C');
    }
    
    if (percentages.calcium < 80) {
      recommendations.push('Include more dairy products or leafy greens for calcium');
    }
    
    if (totals.sodium > 2000) {
      recommendations.push('Reduce sodium by limiting processed foods and added salt');
    }
    
    return recommendations;
  }
}

module.exports = new NutritionService();