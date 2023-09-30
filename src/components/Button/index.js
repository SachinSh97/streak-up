import React from 'react';
import './Button.css';

const Button = ({ variant, startIcon, endIcon, content, onClick }) => {
  const getClassName = (variant) => ({ contained: 'contained-btn' }[variant]);

  return (
    <button
      className={`${getClassName(variant)} flex align-center justify-center`}
      onClick={onClick}
    >
      {!!startIcon && <span className="start-icon">{startIcon}</span>}
      <span className="content">{content}</span>
      {!!endIcon && <span className="icon">{endIcon}</span>}
    </button>
  );
};

Button.defaultProps = {
  variant: 'contained',
};

export default Button;
