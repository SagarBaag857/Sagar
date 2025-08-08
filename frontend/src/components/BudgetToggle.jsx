import React from 'react';

const BudgetToggle = ({ enabled, onToggle }) => (
  <label style={{ display: 'block', margin: '1rem 0' }}>
    <input
      type="checkbox"
      checked={enabled}
      onChange={(e) => onToggle(e.target.checked)}
    />{' '}
    Budget Mode (keep it cheap!)
  </label>
);

export default BudgetToggle;