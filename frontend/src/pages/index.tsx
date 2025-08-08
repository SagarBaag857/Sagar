import React, { useState, useCallback } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { 
  CameraIcon, 
  PlusIcon, 
  SparklesIcon, 
  ClockIcon,
  DollarSignIcon,
  HeartIcon,
  ChefHatIcon,
  ImageIcon,
  ArrowRightIcon,
  Loader2,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react'

interface Ingredient {
  name: string
  confidence?: number
  quantity?: string
}

interface Recipe {
  title: string
  description: string
  prep_time: number
  cook_time: number
  total_time: number
  servings: number
  difficulty_level: string
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    preparation?: string
  }>
  instructions: Array<{
    step: number
    instruction: string
    duration?: number
    tips?: string
  }>
  nutrition: {
    calories_per_serving: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  estimated_cost?: number
  cost_per_serving?: number
  is_budget_friendly?: boolean
  tags: string[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [manualIngredient, setManualIngredient] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'ingredients' | 'preferences' | 'recipes'>('ingredients')
  const [budgetMode, setBudgetMode] = useState(false)
  const [budgetLimit, setBudgetLimit] = useState(15)
  const [preferences, setPreferences] = useState({
    meal_type: '',
    cuisine_type: '',
    dietary_restrictions: [] as string[],
    max_cooking_time: 60,
    serving_size: 4,
    difficulty_level: 'intermediate'
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('enhance_quality', 'true')

      const response = await fetch(`${API_BASE_URL}/api/v1/ingredients/detect-from-image`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.success) {
        const detectedIngredients = data.detected_ingredients.map((item: any) => ({
          name: item.matched_name || item.detected_name,
          confidence: item.final_confidence || item.confidence,
        }))
        
        setIngredients(prev => [...prev, ...detectedIngredients])
        toast.success(`Detected ${detectedIngredients.length} ingredients!`)
      } else {
        toast.error('Failed to detect ingredients from image')
      }
    } catch (error) {
      console.error('Error detecting ingredients:', error)
      toast.error('Error processing image')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const addManualIngredient = () => {
    if (manualIngredient.trim()) {
      setIngredients(prev => [...prev, { name: manualIngredient.trim() }])
      setManualIngredient('')
    }
  }

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const generateRecipes = async () => {
    if (ingredients.length === 0) {
      toast.error('Please add some ingredients first!')
      return
    }

    setIsLoading(true)
    try {
      const endpoint = budgetMode 
        ? `${API_BASE_URL}/api/v1/recipes/generate-budget`
        : `${API_BASE_URL}/api/v1/recipes/generate`
      
      const requestBody = budgetMode ? {
        ingredients: ingredients.map(i => i.name),
        budget_limit: budgetLimit,
        preferences,
        count: 3,
        serving_size: preferences.serving_size
      } : {
        ingredients: ingredients.map(i => i.name),
        preferences,
        count: 3,
        ...preferences
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      
      if (data.success) {
        setRecipes(data.recipes)
        setCurrentStep('recipes')
        toast.success(`Generated ${data.recipes.length} recipes!`)
      } else {
        toast.error('Failed to generate recipes')
      }
    } catch (error) {
      console.error('Error generating recipes:', error)
      toast.error('Error generating recipes')
    } finally {
      setIsLoading(false)
    }
  }

  const resetApp = () => {
    setIngredients([])
    setRecipes([])
    setCurrentStep('ingredients')
    setPreferences({
      meal_type: '',
      cuisine_type: '',
      dietary_restrictions: [],
      max_cooking_time: 60,
      serving_size: 4,
      difficulty_level: 'intermediate'
    })
  }

  return (
    <>
      <Head>
        <title>AI Recipe Generator - Turn Your Ingredients Into Delicious Recipes</title>
        <meta name="description" content="Upload a photo of your fridge or list your ingredients, and our AI will generate personalized recipes with step-by-step instructions and nutrition info." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
        {/* Header */}
        <header className="relative overflow-hidden bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10" />
          <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <ChefHatIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">AI Recipe Generator</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setBudgetMode(!budgetMode)}
                  className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    budgetMode 
                      ? 'bg-secondary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <DollarSignIcon className="h-4 w-4" />
                  <span>Budget Mode</span>
                </button>
                {(ingredients.length > 0 || recipes.length > 0) && (
                  <button
                    onClick={resetApp}
                    className="btn-outline"
                  >
                    Start Over
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center space-x-4">
              {['ingredients', 'preferences', 'recipes'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    currentStep === step 
                      ? 'bg-primary-600 text-white' 
                      : index < ['ingredients', 'preferences', 'recipes'].indexOf(currentStep)
                        ? 'bg-secondary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < ['ingredients', 'preferences', 'recipes'].indexOf(currentStep) ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium capitalize text-gray-700">
                    {step}
                  </span>
                  {index < 2 && <ArrowRightIcon className="ml-4 h-4 w-4 text-gray-400" />}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 'ingredients' && (
              <motion.div
                key="ingredients"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Hero Section */}
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                    What&apos;s in your fridge?
                  </h2>
                  <p className="mt-4 text-xl text-gray-600">
                    Upload a photo or list your ingredients to get started
                  </p>
                </div>

                {/* Upload Section */}
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Image Upload */}
                  <div className="card">
                    <h3 className="mb-4 flex items-center text-lg font-semibold">
                      <CameraIcon className="mr-2 h-5 w-5 text-primary-600" />
                      Upload Fridge Photo
                    </h3>
                    <div
                      {...getRootProps()}
                      className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                        isDragActive 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-300 hover:border-primary-400 hover:bg-primary-25'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  </div>

                  {/* Manual Input */}
                  <div className="card">
                    <h3 className="mb-4 flex items-center text-lg font-semibold">
                      <PlusIcon className="mr-2 h-5 w-5 text-secondary-600" />
                      Add Ingredients Manually
                    </h3>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={manualIngredient}
                        onChange={(e) => setManualIngredient(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addManualIngredient()}
                        placeholder="Enter ingredient name..."
                        className="input flex-1"
                      />
                      <button
                        onClick={addManualIngredient}
                        className="btn-primary"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Type ingredient names and press Enter or click the + button
                    </p>
                  </div>
                </div>

                {/* Ingredients List */}
                {ingredients.length > 0 && (
                  <div className="card">
                    <h3 className="mb-4 text-lg font-semibold">
                      Your Ingredients ({ingredients.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 rounded-full bg-primary-100 px-3 py-1 text-sm"
                        >
                          <span className="font-medium text-primary-800">{ingredient.name}</span>
                          {ingredient.confidence && (
                            <span className="text-xs text-primary-600">
                              {Math.round(ingredient.confidence * 100)}%
                            </span>
                          )}
                          <button
                            onClick={() => removeIngredient(index)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setCurrentStep('preferences')}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <span>Set Preferences</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Customize Your Recipes
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Tell us your preferences to get personalized recipes
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="card space-y-4">
                    <h3 className="text-lg font-semibold">Basic Preferences</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Meal Type</label>
                      <select
                        value={preferences.meal_type}
                        onChange={(e) => setPreferences(prev => ({ ...prev, meal_type: e.target.value }))}
                        className="input mt-1"
                      >
                        <option value="">Any</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cuisine Type</label>
                      <select
                        value={preferences.cuisine_type}
                        onChange={(e) => setPreferences(prev => ({ ...prev, cuisine_type: e.target.value }))}
                        className="input mt-1"
                      >
                        <option value="">Any</option>
                        <option value="italian">Italian</option>
                        <option value="mexican">Mexican</option>
                        <option value="asian">Asian</option>
                        <option value="american">American</option>
                        <option value="mediterranean">Mediterranean</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Max Cooking Time: {preferences.max_cooking_time} minutes
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="180"
                        value={preferences.max_cooking_time}
                        onChange={(e) => setPreferences(prev => ({ ...prev, max_cooking_time: parseInt(e.target.value) }))}
                        className="mt-1 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Servings: {preferences.serving_size}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={preferences.serving_size}
                        onChange={(e) => setPreferences(prev => ({ ...prev, serving_size: parseInt(e.target.value) }))}
                        className="mt-1 w-full"
                      />
                    </div>
                  </div>

                  <div className="card space-y-4">
                    <h3 className="text-lg font-semibold">
                      {budgetMode ? 'Budget Settings' : 'Additional Options'}
                    </h3>
                    
                    {budgetMode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Budget per serving: ${budgetLimit}
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={budgetLimit}
                          onChange={(e) => setBudgetLimit(parseInt(e.target.value))}
                          className="mt-1 w-full"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Difficulty Level</label>
                      <select
                        value={preferences.difficulty_level}
                        onChange={(e) => setPreferences(prev => ({ ...prev, difficulty_level: e.target.value }))}
                        className="input mt-1"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dietary Restrictions</label>
                      <div className="mt-2 space-y-2">
                        {['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto'].map((restriction) => (
                          <label key={restriction} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={preferences.dietary_restrictions.includes(restriction)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPreferences(prev => ({
                                    ...prev,
                                    dietary_restrictions: [...prev.dietary_restrictions, restriction]
                                  }))
                                } else {
                                  setPreferences(prev => ({
                                    ...prev,
                                    dietary_restrictions: prev.dietary_restrictions.filter(r => r !== restriction)
                                  }))
                                }
                              }}
                              className="rounded text-primary-600"
                            />
                            <span className="ml-2 text-sm capitalize">{restriction.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setCurrentStep('ingredients')}
                    className="btn-outline"
                  >
                    Back
                  </button>
                  <button
                    onClick={generateRecipes}
                    disabled={isLoading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4" />
                        <span>Generate Recipes</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'recipes' && recipes.length > 0 && (
              <motion.div
                key="recipes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Your Personalized Recipes
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {budgetMode 
                      ? `Budget-friendly recipes under $${budgetLimit} per serving`
                      : 'AI-generated recipes based on your ingredients and preferences'
                    }
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {recipes.map((recipe, index) => (
                    <div key={index} className="card">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{recipe.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{recipe.description}</p>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {recipe.tags?.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="rounded-full bg-secondary-100 px-2 py-1 text-xs font-medium text-secondary-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <ClockIcon className="mx-auto h-5 w-5 text-gray-400" />
                          <div className="mt-1 text-sm font-medium">{recipe.total_time}m</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div>
                          <span className="mx-auto block text-lg">👥</span>
                          <div className="mt-1 text-sm font-medium">{recipe.servings}</div>
                          <div className="text-xs text-gray-500">Servings</div>
                        </div>
                        <div>
                          <span className="mx-auto block text-lg">🔥</span>
                          <div className="mt-1 text-sm font-medium">{recipe.nutrition?.calories_per_serving || 0}</div>
                          <div className="text-xs text-gray-500">Calories</div>
                        </div>
                      </div>

                      {budgetMode && recipe.cost_per_serving && (
                        <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary-50 p-3">
                          <span className="text-sm font-medium text-secondary-800">Cost per serving</span>
                          <span className="text-lg font-bold text-secondary-600">
                            ${recipe.cost_per_serving.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Ingredients:</h4>
                          <ul className="mt-1 text-sm text-gray-600">
                            {recipe.ingredients?.slice(0, 3).map((ing, ingIndex) => (
                              <li key={ingIndex}>
                                {ing.quantity} {ing.unit} {ing.name}
                              </li>
                            ))}
                            {recipe.ingredients?.length > 3 && (
                              <li className="text-gray-400">
                                +{recipe.ingredients.length - 3} more...
                              </li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900">Instructions:</h4>
                          <ol className="mt-1 text-sm text-gray-600">
                            {recipe.instructions?.slice(0, 2).map((step, stepIndex) => (
                              <li key={stepIndex} className="mb-1">
                                {step.step}. {step.instruction}
                              </li>
                            ))}
                            {recipe.instructions?.length > 2 && (
                              <li className="text-gray-400">
                                +{recipe.instructions.length - 2} more steps...
                              </li>
                            )}
                          </ol>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button className="btn-outline flex-1 text-xs">
                          <HeartIcon className="mr-1 h-3 w-3" />
                          Save
                        </button>
                        <button className="btn-primary flex-1 text-xs">
                          View Full Recipe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setCurrentStep('preferences')}
                    className="btn-outline"
                  >
                    Adjust Preferences
                  </button>
                  <button
                    onClick={generateRecipes}
                    disabled={isLoading}
                    className="btn-secondary"
                  >
                    Generate More Recipes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="rounded-lg bg-white p-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
                <p className="mt-2 text-sm text-gray-600">
                  {currentStep === 'ingredients' ? 'Analyzing your image...' : 'Generating amazing recipes...'}
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 bg-gray-900 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold">AI Recipe Generator</h3>
              <p className="mt-2 text-gray-400">
                Transform your ingredients into delicious meals with the power of AI
              </p>
              <div className="mt-4 flex justify-center space-x-6">
                <div className="text-sm text-gray-400">
                  ✨ Computer Vision • 🤖 AI-Powered • 💰 Budget-Friendly • 📱 Mobile Ready
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}