import React from 'react';
import './Switch.css';

const Switch = ({ title, name, checked, onChange }) => {
  return (
    <label class="switch" title={title}>
      <input name={name} type="checkbox" checked={checked} onChange={onChange} />
      <span class="slider round" />
    </label>
  );
};

export default Switch;
