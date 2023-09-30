import React, { useEffect, useRef, useState } from 'react';

import './Toast.css';

const Toast = ({ type, message, timeout }) => {
  const timeoutId = useRef();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!message || message?.length === 0) return;

    setIsMounted(true);
    timeoutId.current = setTimeout(() => setIsMounted(false), timeout);

    return () => clearTimeout(timeoutId.current);
  }, [message]);

  return (
    <div className={`toast ${isMounted ? 'slide-in' : 'slide-out'} ${type}`}>
      <span className="message">{message}</span>
    </div>
  );
};

Toast.defaultProps = {
  type: 'success',
  timeout: 3000,
};

export default Toast;
