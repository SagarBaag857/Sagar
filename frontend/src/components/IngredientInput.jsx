import React, { useState } from 'react';

const IngredientInput = ({ ingredients, setIngredients }) => {
  const [value, setValue] = useState('');

  const addIngredient = () => {
    const trimmed = value.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
    }
    setValue('');
  };

  const removeIngredient = (item) => {
    setIngredients(ingredients.filter((i) => i !== item));
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <input
        type="text"
        value={value}
        placeholder="Add ingredient..."
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
      />
      <button onClick={addIngredient}>Add</button>

      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {ingredients.map((item) => (
          <li key={item} style={{ marginTop: '0.3rem' }}>
            {item}{' '}
            <button onClick={() => removeIngredient(item)} style={{ color: 'red' }}>
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IngredientInput;