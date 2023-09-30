import React from 'react';

import streakupLogo from '../../assets/streakup-logo.svg';
import './Loader.css';

const Loader = () => {
  return (
    <div className="flex flex-column loader-wrapper">
      <div className="loader">
        <img className="logo" src={streakupLogo} alt="streakup-logo" />
        <div className="bounce">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
          <div className="bounce3"></div>
          <div className="bounce4"></div>
        </div>
      </div>
      <div className="loader-overlay"></div>
    </div>
  );
};

export default Loader;
