import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { chromeStorageKey } from '../../../config';
import { setItem, getItem } from '../../../background/helper';

import Animation from '../../../components/Animation';
import Switch from '../../../components/Switch';

import backIcon from '../../../assets/icons/arrow-back.svg';
import './Setting.css';

const Setting = () => {
  const navigate = useNavigate();
  const [sound, setSound] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [notification, setNotification] = useState(true);

  useEffect(() => {
    initiatePreference();
  }, []);

  useEffect(() => {
    const preference = { sound, reminder, notification };
    setItem(chromeStorageKey.preference, preference);
  }, [sound, reminder, notification]);

  const initiatePreference = () => {
    getItem(chromeStorageKey.preference).then((response) => {
      const { sound = true, reminder = true, notification = true } = response?.preference ?? {};
      setSound(sound);
      setReminder(reminder);
      setNotification(notification);
    });
  };

  const handleOnChange = (event) => {
    const { name, checked } = event?.target ?? {};
    switch (name) {
      case 'sound':
        setSound(checked);
        break;
      case 'reminder':
        setReminder(checked);
        break;
      case 'notification':
        setNotification(checked);
        break;
      default:
        break;
    }
  };

  const handleRedirectToNotification = () => navigate('/notifications');

  return (
    <Animation>
      <div className="settings flex flex-column">
        <div className="settings-header flex align-center justify-between">
          <span className="flex align-center">
            <img
              className="back-icon"
              src={backIcon}
              alt="back"
              onClick={handleRedirectToNotification}
            />
            <span className="title">Preference</span>
          </span>
        </div>
        <div className="settings-list flex flex-column">
          <div className="flex align-center justify-between mb-32">
            <span className="flex flex-column flex-1">
              <span className="label">Sound</span>
              <span className="description">Enable/Disable notifications sound.</span>
            </span>
            <Switch name="sound" checked={sound} onChange={handleOnChange} />
          </div>
          <div className="flex align-center justify-between mb-32">
            <span className="flex flex-column flex-1">
              <span className="label">Streak Reminder</span>
              <span className="description">Enable/Disable receiving streak reminders.</span>
            </span>
            <Switch name="reminder" checked={reminder} onChange={handleOnChange} />
          </div>
          <div className="flex align-center justify-between mb-32">
            <span className="flex flex-column flex-1">
              <span className="label">Github Notification</span>
              <span className="description">Enable/Disable receiving github notifications.</span>
            </span>
            <Switch name="notification" checked={notification} onChange={handleOnChange} />
          </div>
        </div>
      </div>
    </Animation>
  );
};

export default Setting;
