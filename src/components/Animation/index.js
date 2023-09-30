import React, { useEffect, useRef, useState } from 'react';
import './Animation.css';

const Animation = ({ children }) => {
  const animationId = useRef();
  const [animationType, setAnimationType] = useState('');

  useEffect(() => {
    animationId.current = setTimeout(() => setAnimationType('fade-in'));

    return () => {
      clearTimeout(animationId.current);
      setAnimationType('fade-out');
    };
  }, []);

  return <div className={`animation ${animationType}`}>{children}</div>;
};

export default Animation;
