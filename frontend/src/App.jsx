import React, { useState } from 'react';
import axios from 'axios';
import IngredientInput from './components/IngredientInput.jsx';
import ImageUpload from './components/ImageUpload.jsx';
import RecipeDisplay from './components/RecipeDisplay.jsx';
import BudgetToggle from './components/BudgetToggle.jsx';

const App = () => {
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [budgetMode, setBudgetMode] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/recipes', {
        ingredients,
        budgetMode,
      });
      setRecipe(data.recipe);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleImageIngredients = (detected) => {
    setIngredients(detected);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <h1>🥦 Fridge AI Recipe Generator</h1>
      <p>Upload a fridge photo or type your available items, and get a delicious recipe!</p>

      <BudgetToggle enabled={budgetMode} onToggle={setBudgetMode} />
      <ImageUpload onIngredientsDetected={handleImageIngredients} />
      <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />

      <button onClick={handleGenerate} disabled={loading || ingredients.length === 0} style={{ marginTop: '1rem' }}>
        {loading ? 'Generating…' : 'Generate Recipe'}
      </button>

      {recipe && <RecipeDisplay recipeText={recipe} />}
    </div>
  );
};

export default App;