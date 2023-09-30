import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getUserContributionApi, githubLoginApi } from '../../../api';
import {
  formatNumber,
  formatLocalDateTime,
  getContributionStats,
  getContributionDates,
} from '../../../utils/helper';
import { loadState, removeState, saveState } from '../../../utils/storage';
import { getItem, removeItem } from '../../../background/helper';
import {
  localStorageKey,
  dateFormats,
  contributionRefreshDuration,
  githubUrl,
  chromeStorageKey,
} from '../../../config';

import Toast from '../../../components/Toast';
import Animation from '../../../components/Animation';

import notificationIcon from '../../../assets/icons/notifications-icon.svg';
import githubIcon from '../../../assets/icons/github-theme.svg';
import streakCicle from '../../../assets/streak.svg';
import emptyStreakCircle from '../../../assets/empty-streak.svg';
import logoutIcon from '../../../assets/icons/logout.svg';

import './Home.css';

const Home = ({ storageChanges }) => {
  const navigate = useNavigate();
  const timeoutId = useRef();
  const [notificationCount, setNotificationCount] = useState('');
  const [userDetails, setUserDetails] = useState({});
  const [contributionStats, setContributionStats] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    initializeHome();
    checkNotificationSetup();

    return () => clearTimeout(timeoutId.current);
  }, []);

  useEffect(() => {
    if (!!storageChanges) {
      checkNotificationSetup();
    }
  }, [storageChanges]);

  const initializeHome = () => {
    const draftUserDetails = loadState(localStorageKey.userDetails);
    const draftContributions = loadState(localStorageKey?.contributions);
    const draftContributionsStats = getContributionStats(draftContributions, []);

    setContributionStats(draftContributionsStats);
    setUserDetails(draftUserDetails ?? {});
    handleRefreshData();
  };

  const checkNotificationSetup = async () => {
    try {
      const userToken = await getItem(chromeStorageKey.token);
      if (!!userToken?.token) {
        const { notifications = {} } = await getItem(chromeStorageKey.notifications);
        setNotificationCount(notifications?.data?.length ?? 0);
      } else {
        setNotificationCount('!');
      }
    } catch (error) {
      console.error(error?.message ?? 'Something went wrong!');
    }
  };

  const handleOpenProfile = () => {
    if (!userDetails?.login) return;
    window.open(`${githubUrl}/${userDetails?.login}`, '_blank');
  };

  const handleOnLogout = () => {
    Promise.all([
      removeItem(chromeStorageKey.token),
      removeItem(chromeStorageKey.notifications),
    ]).then(() => {
      removeState(localStorageKey.userDetails);
      removeState(localStorageKey.lasUpdated);
      removeState(localStorageKey.contributions);
      clearTimeout(timeoutId.current);
      navigate('/login');
    });
  };

  const getTodayContribtionGraphs = async (userId) => {
    const end = new Date()?.toISOString();
    const start = `${end?.split('T')?.[0]}T00:00:00Z`;

    return await getUserContributionApi(userId, start, end).then((response) => {
      if (!response || !response?.data || response?.errors) {
        const errorMessage =
          response?.errors[0]?.message ?? response?.message ?? 'An api error occurred';
        const errorType = response?.errors[0]?.type ?? '';
        // Github API error - not found
        if (errorType === 'NOT_FOUND') {
          throw new Error('Could not find a user.');
        }
        throw new Error(errorMessage);
      }
      const userCreatedDateTimeString = response?.data?.user?.createdAt ?? null;
      if (!userCreatedDateTimeString) {
        throw new Error('Failed to retrieve contributions. This is likely a GitHub API issue.');
      }
      return { [new Date().getFullYear()]: response };
    });
  };

  const githubLoginPromise = async (githubId) =>
    await githubLoginApi(githubId).then((response) => {
      if (!response || !response?.data || response?.errors) {
        const errorMessage = response?.errors[0]?.message ?? response?.message ?? error?.generic;
        throw new Error(errorMessage);
      }
      return response?.data?.user ?? {};
    });

  const handleRefreshData = () => {
    const userDetails = loadState(localStorageKey.userDetails);
    const lastUpdate = loadState(localStorageKey.lasUpdated);
    const lastUpdateMillis = new Date(lastUpdate).getTime();
    const currentTimeMillis = new Date().getTime();
    const timeDiff = currentTimeMillis - lastUpdateMillis;

    if (timeDiff >= contributionRefreshDuration) {
      Promise.all([
        githubLoginPromise(userDetails?.login),
        getTodayContribtionGraphs(userDetails?.login),
      ])
        .then(([userDetails, contributionGraphs]) => {
          const timestamp = new Date().toISOString();
          const newContributions = getContributionDates(contributionGraphs);
          const oldContributions = loadState(localStorageKey.contributions);
          const updatedContributions = { ...oldContributions, ...newContributions };
          const updatedContributionStats = getContributionStats(updatedContributions);

          setUserDetails(userDetails);
          setContributionStats(updatedContributionStats);
          saveState(localStorageKey.contributions, updatedContributions);
          saveState(localStorageKey.lasUpdated, timestamp);
          saveState(localStorageKey.userDetails, userDetails);

          clearTimeout(timeoutId.current);
          timeoutId.current = setTimeout(handleRefreshData, contributionRefreshDuration);
        })
        .catch((errorResponse) => {
          clearTimeout(timeoutId.current);
          timeoutId.current = setTimeout(handleRefreshData, contributionRefreshDuration);
          setErrorMessage(errorResponse?.message);
        });
    } else {
      clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(handleRefreshData, timeDiff);
    }
  };

  const handleOpenNotifications = () => {
    navigate('/notifications');
  };

  const renderDuration = (duration, formate = dateFormats.formatTwo) => {
    const { start = null, end = null } = duration ?? {};
    if (!!start && !!end) {
      return `${formatLocalDateTime(start, formate)} - ${formatLocalDateTime(end, formate)}`;
    } else if (!!start && !end) {
      return `${formatLocalDateTime(start, formate)} - Present`;
    }
  };

  const userInfo = [
    { label: 'Followers', value: formatNumber(userDetails?.followers?.totalCount ?? 0) },
    { label: 'Following', value: formatNumber(userDetails?.following?.totalCount ?? 0) },
  ];

  return (
    <Animation>
      <div className="home flex flex-column">
        <div className="home-header flex flex-column">
          <div className="flex align-center justify-between">
            <span className="flex align-center">
              <img
                className="github-link"
                src={githubIcon}
                alt="github"
                onClick={handleOpenProfile}
              />
              <span className="greeting">
                Hi, <span>{userDetails?.name ?? ''}</span>
              </span>
            </span>
            <span className="notification-wrapper" onClick={handleOpenNotifications}>
              <img className="notification" src={notificationIcon} alt="notification" />
              {!!notificationCount && (
                <span className={`badge ${notificationCount > 50 && 'plus'}`}>
                  {notificationCount != '!'
                    ? notificationCount < 50
                      ? notificationCount
                      : 50
                    : notificationCount}
                </span>
              )}
            </span>
          </div>
          <div className="flex align-center mt-20">
            {userInfo?.map((info, index) => (
              <span key={index} className="flex flex-column mr-20">
                <span className="value">{info?.value}</span>
                <span className="label">{info?.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="current-streak flex flex-column align-center">
          <span className="counter">
            <img
              src={contributionStats?.currentStreak?.length > 0 ? streakCicle : emptyStreakCircle}
              alt="streak"
            />
            <span className={`count ${contributionStats?.currentStreak?.length > 0 && 'active'}`}>
              {formatNumber(contributionStats?.currentStreak?.length ?? 0)}
            </span>
          </span>
          <span className="label">Current Streak</span>
          <span className="duration">
            {`${renderDuration(
              { start: contributionStats?.currentStreak?.start },
              dateFormats.formatOne,
            )}`}
          </span>
        </div>
        <div className="other-streak flex flex-column">
          <div className="flex align-center justify-between">
            <span className="flex flex-column">
              <span className="label">Longest Streak</span>
              <span className="duration">
                {`${renderDuration(contributionStats?.longestStreak)}`}
              </span>
            </span>
            <span className="count">
              {formatNumber(contributionStats?.longestStreak?.length ?? 0)}
            </span>
          </div>
          <div className="flex align-center justify-between">
            <span className="flex flex-column">
              <span className="label">Total Contributors</span>
              <span className="duration">
                {`${renderDuration({ start: contributionStats?.firstContribution })}`}
              </span>
            </span>
            <span className="count">
              {formatNumber(contributionStats?.totalContributions ?? 0)}
            </span>
          </div>
        </div>
        <div className="logout flex align-center justify-center" onClick={handleOnLogout}>
          <img src={logoutIcon} alt="logout" />
          <span>Logout</span>
        </div>
      </div>
      <Toast type="error" message={errorMessage} />
    </Animation>
  );
};

export default Home;
