import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getItem, setItem, handleSetBadge } from '../../../background/helper';
import { baseApiUrl, githubUrl, chromeStorageKey } from '../../../config';
import { formateDate, isToday } from '../../../utils/helper';

import Loader from '../../../components/Loader';
import Animation from '../../../components/Animation';
import TextField from '../../../components/TextField';
import Button from '../../../components/Button';
import Toast from '../../../components/Toast';

import backIcon from '../../../assets/icons/arrow-back.svg';
import emptyPlceholder from '../../../assets/empty-placeholder.png';
import settingIcon from '../../../assets/icons/setting.svg';
import './Notification.css';

const Notification = ({ storageChanges }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isMute, setIsMute] = useState(false);
  const [enterpriseUrl, setEnterpriseUrl] = useState(baseApiUrl);
  const [token, setToken] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isNotificationSetup, setIsNotificationSetup] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkNotificationSetup();
    setNotifications([
      {
        id: '7967467667',
        last_read_at: null,
        reason: 'review_requested',
        repository: {
          full_name: 'fudrin/fudr-web-client',
          archive_url: 'https://api.github.com/repos/fudrin/fudr-web-client{archive_format}{/ref}',
          assignees_url: 'https://api.github.com/repos/fudrin/fudr-web-client/assignees{/user}',
          blobs_url: 'https://api.github.com/repos/fudrin/fudr-web-client/git/blobs{/sha}',
          branches_url: 'https://api.github.com/repos/fudrin/fudr-web-client/branches{/branch}',
          collaborators_url:
            'https://api.github.com/repos/fudrin/fudr-web-client/collaborators{/collaborator}',
        },
        subject: {
          latest_comment_url: 'https://api.github.com/repos/fudrin/fudr-web-client/pulls/968',
          title: 'fix loyalty card refresh points not visible',
          type: 'PullRequest',
          url: 'https://api.github.com/repos/fudrin/fudr-web-client/pulls/968',
        },
        subscription_url: 'https://api.github.com/notifications/threads/7967467666/subscription',
        unread: true,
        updated_at: '2023-10-06T13:04:54Z',
        url: 'https://api.github.com/notifications/threads/7967467666',
      },
    ]);
  }, []);

  useEffect(() => {
    if (!!storageChanges) {
      for (let [key, { newValue }] of Object.entries(storageChanges)) {
        switch (key) {
          case chromeStorageKey.notifications:
            if (!!newValue && newValue != {}) {
              setNotifications(newValue?.data ?? []);
            }
            break;
          case chromeStorageKey.token:
            checkNotificationSetup();
            break;
          default:
            break;
        }
      }
    }
  }, [storageChanges]);

  const checkNotificationSetup = async () =>
    await Promise.all([
      getItem(chromeStorageKey.token),
      getItem(chromeStorageKey.notifications),
      getItem(chromeStorageKey.preference),
    ])
      .then(([userToken, userNotification, userPreference]) => {
        const { token = '' } = userToken ?? {};
        const { notifications } = userNotification ?? {};
        const { mute = false } = userPreference?.preference ?? {};
        setIsNotificationSetup(!!token);
        setNotifications(notifications?.data ?? []);
        setIsMute(mute);
      })
      .catch((error) => console.error(error?.message ?? 'Something went wrong!'))
      .finally(() => setIsLoading(false));

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    switch (name) {
      case 'enterpriseUrl':
        setEnterpriseUrl(value);
        break;
      case 'token':
        setToken(value);
        break;
      default:
        break;
    }
  };

  const handleSubmitSetting = () => {
    setErrorMessage('');
    if (enterpriseUrl?.length === 0 || token?.length === 0) {
      setErrorMessage('Please enter valid value!');
      return;
    }
    setIsLoading(true);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    };
    fetch(`${enterpriseUrl}/notifications?participating=true&page=1&per_page=100`, {
      method: 'GET',
      headers,
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then(() => {
            throw new Error();
          });
        }
        return response.json();
      })
      .then((response) => {
        const notifications = { data: response ?? [], lastUpdated: new Date()?.toISOString() };
        setItem(chromeStorageKey.token, token);
        setItem(chromeStorageKey.origin, enterpriseUrl);
        setItem(chromeStorageKey.notifications, notifications);
        handleSetBadge(`${response?.length ?? ''}`, '#ffffff', '#ff9704');
        setIsNotificationSetup(true);
      })
      .catch(() => setErrorMessage('Please enter valid value!'))
      .finally(() => setIsLoading(false));
  };

  const handleMuteNotification = () => {
    setItem(chromeStorageKey.preference, { mute: !isMute }).then(() => {
      setIsMute(!isMute);
    });
  };

  const handleRedirectToHome = () => navigate('/home');

  const handleRedirectToSetting = () => navigate('/setting');

  const handleOpenNotification = () => window.open(`${githubUrl}/notifications`, '_blank');

  const renderLabel = (reason) =>
    ({
      assign: '🎯 Assigned',
      mention: '✋ Mentioned',
      team_mention: '🙌 Team mentioned',
      review_requested: ' 👀 Review requested',
      author: '✍️ Author',
    }[reason] ?? reason);

  const todays = notifications?.filter((notification) => isToday(notification?.updated_at)) ?? [];

  const older = notifications?.filter((notification) => !isToday(notification?.updated_at)) ?? [];

  return (
    <Animation>
      {isLoading && <Loader />}
      <div className="notifications flex flex-column">
        <div className="notifications-header flex align-center justify-between">
          <span className="flex align-center">
            <img className="back-icon" src={backIcon} alt="back" onClick={handleRedirectToHome} />
            <span className="title">
              {isNotificationSetup ? 'All Notifications' : 'Setup Notification'}
            </span>
          </span>
          <span className="setting" onClick={handleRedirectToSetting}>
            <img src={settingIcon} alt="setting" />
          </span>
        </div>
        {isNotificationSetup ? (
          notifications?.length > 0 ? (
            <div className="notifications-list flex flex-column flex-1 hide-scrollable">
              {todays?.length > 0 && <div className="subheading">Today's</div>}
              {todays?.map((notification, index) => (
                <div
                  key={index}
                  className="notifications-list-item flex align-center justify-between"
                  onClick={handleOpenNotification}
                >
                  <span className="flex flex-column">
                    <span className="full-name" title={notification?.repository?.full_name ?? ''}>
                      {notification?.repository?.full_name ?? ''}
                    </span>
                    <span className="subject-title" title={notification?.subject?.title ?? ''}>
                      {notification?.subject?.title ?? ''}
                    </span>
                  </span>
                  <span className="flex flex-column">
                    <span className="reason">{renderLabel(notification?.reason ?? '')}</span>
                    <span className="timestamp">{formateDate(notification?.updated_at ?? '')}</span>
                  </span>
                </div>
              ))}
              {older?.length > 0 && <div className="subheading">Older</div>}
              {older?.map((notification, index) => (
                <div
                  key={index}
                  className="notifications-list-item flex align-center justify-between"
                  onClick={handleOpenNotification}
                >
                  <span className="flex flex-column">
                    <span className="full-name" title={notification?.repository?.full_name ?? ''}>
                      {notification?.repository?.full_name ?? ''}
                    </span>
                    <span className="subject-title" title={notification?.subject?.title ?? ''}>
                      {notification?.subject?.title ?? ''}
                    </span>
                  </span>
                  <span className="flex flex-column">
                    <span className="reason">{renderLabel(notification?.reason ?? '')}</span>
                    <span className="timestamp">{formateDate(notification?.updated_at ?? '')}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="notification-list-empty flex-1 flex flex-column align-center">
              <img src={emptyPlceholder} alt="empty" />
              <span>🎉 Enjoy your notification-free time! 🎉</span>
            </div>
          )
        ) : (
          <div className="notification-setup flex flex-column">
            <div className="sub-heading">Root URL</div>
            <div className="root-url flex flex-column">
              <TextField
                id="enterprise-url"
                className="textField"
                name="enterpriseUrl"
                value={enterpriseUrl}
                onChange={handleOnChange}
              />
              <span className="instruction">Specify the root URL to your GitHub Enterprise.</span>
            </div>
            <div className="sub-heading">Token</div>
            <div className="flex flex-column">
              <TextField
                id="user-token"
                className="textField"
                name="token"
                value={token}
                onChange={handleOnChange}
              />
              <span className="instruction">
                For public repositories,
                <a
                  href="https://github.com/settings/tokens/new?scopes=notifications&description=Streak%20Up%20GitHub%20extension"
                  target="_blank"
                >
                  {` create a token `}
                </a>
                with the <strong>notifications</strong> permission and specify it.
              </span>
              <span className="instruction">
                If you want notifications for private repositories, you'll need to
                <a
                  href="https://github.com/settings/tokens/new?scopes=notifications,repo&description=Streak%20Up%20GitHub%20extension"
                  target="_blank"
                >
                  {` create a token `}
                </a>
                with the <strong>notifications and repo</strong> permissions.
              </span>
              <span className="instruction flex flex-column">
                <span className="note">Privacy First: No Storage</span>
                <span>Your data stays with you. We don't store any of it.</span>
              </span>
            </div>
            <div className="footer">
              <Button content="Submit" onClick={handleSubmitSetting} />
            </div>
          </div>
        )}
      </div>
      <Toast type="error" message={errorMessage} />
    </Animation>
  );
};

export default Notification;
