import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './Login';
import Home from './Home';
import Notification from './Notification';
import Setting from './Setting';

const Container = () => {
  const { pathname } = useLocation();
  const [storageChanges, setStorageChange] = useState();

  useEffect(() => {
    chrome.storage.onChanged.addListener(handleStorageOnChange);

    () => chrome.storage.onChanged.removeListener(handleStorageOnChange);
  }, []);

  const handleStorageOnChange = (changes) => setStorageChange(changes);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home storageChanges={storageChanges} />} />
      <Route path="/notifications" element={<Notification storageChanges={storageChanges} />} />
      <Route path="/setting" element={<Setting storageChanges={storageChanges} />} />
      <Route exact path={pathname} element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default Container;
