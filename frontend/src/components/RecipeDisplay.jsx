import React from 'react';

const RecipeDisplay = ({ recipeText }) => {
  return (
    <div style={{ marginTop: '2rem', whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: '1rem', borderRadius: 8 }}>
      {recipeText}
    </div>
  );
};

export default RecipeDisplay;