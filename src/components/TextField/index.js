import React from 'react';
import './TextField.css';

const TextField = ({
  id,
  className,
  name,
  type,
  label,
  placeholder,
  error,
  value,
  autoFocus,
  onChange,
  onBlur,
}) => {
  return (
    <div className={`flex flex-column textfield ${className}`}>
      {!!label && (
        <label className="textfield-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`textfield-input ${error ? 'error' : ''}`}
        name={name}
        type={type}
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    </div>
  );
};

TextField.defaultProps = {
  id: 'textfield',
  name: 'textfield',
  type: 'text',
  className: '',
  placeholder: '',
  onBlur: null,
};

export default TextField;
