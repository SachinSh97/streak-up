import { events, chromeStorageKey, notificationRefreshDurationInMin } from '../config';
import { setItem, handleSetBadge, getItem, removeItem } from './helper';
import { isToday } from '../utils/helper';
import { getUserNotificationApi } from '../api';

const init = () => {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension is installed successfully....');

    handleSetExtensionBadge();
  });

  chrome.runtime.onStartup.addListener(() => {
    console.log('Extension is connected successfully....');

    handleSetExtensionBadge();

    handleTriggerStreakReminder();
  });

  chrome.storage.onChanged.addListener(handleStorageChangeEvent);

  chrome.alarms.onAlarm.addListener(handleAlarmTriggeredEvent);
};

const handleSetExtensionBadge = () =>
  getItem(chromeStorageKey.notifications).then((response) => {
    const { data = [] } = response?.notifications ?? {};
    const count = data?.length > 0 ? `${data?.length}` : '';
    handleSetBadge(count, '#ffffff', '#ff9704');
  });

const handleStorageChangeEvent = (changes) => {
  for (let [key, { newValue }] of Object.entries(changes)) {
    switch (key) {
      case chromeStorageKey.token:
        if (!!newValue) {
          chrome.alarms.clear(events.notifications).then(() => {
            chrome.alarms.create(events.notifications, {
              periodInMinutes: notificationRefreshDurationInMin,
            });
          });
        } else if (!newValue) {
          chrome.alarms.clear(events.notifications).then(() => {
            removeItem(chromeStorageKey.notifications);
            handleSetBadge();
          });
        }
        break;
      default:
        break;
    }
  }
};

const handleAlarmTriggeredEvent = ({ name }) => {
  switch (name) {
    case events.notifications:
      getItem(chromeStorageKey.notifications).then((response) => {
        handleFetchNotifications(response?.notifications ?? {});
      });
      break;
    default:
      break;
  }
};

const handleFetchNotifications = ({ data = [], lastUpdated = '' }) => {
  getUserNotificationApi({ since: lastUpdated })
    .then((newNotifications) => {
      const updatedNotifications = { lastUpdated: new Date().toISOString() };

      if (!!lastUpdated) {
        newNotifications = newNotifications?.filter((notification) =>
          data?.every((item) => item?.id != notification?.id),
        );
        if (!!newNotifications?.[0]) {
          getItem(chromeStorageKey.preference).then(({ preference = {} }) => {
            const { notification = true, sound = true } = preference ?? {};
            if (notification)
              handleTriggerNotificationModal({
                title: newNotifications?.[0]?.repository?.full_name ?? 'Received New notification',
                message: newNotifications?.[0]?.subject?.title ?? '',
                sound,
              });
          });
        }
        updatedNotifications['data'] = [...newNotifications, ...data];
      } else {
        updatedNotifications['data'] = [...newNotifications];
      }

      const count =
        updatedNotifications?.data?.length > 0 ? `${updatedNotifications?.data?.length}` : '';
      handleSetBadge(count, '#ffffff', '#ff9704');
      setItem(chromeStorageKey.notifications, updatedNotifications);
    })
    .catch(() => handleSetBadge('off', '#ffffff', '#c7152a'));
};

const handleTriggerStreakReminder = () => {
  Promise.all([getItem(chromeStorageKey.preference), getItem(chromeStorageKey.reminderTime)]).then(
    ([{ preference = {} }, { reminderTime = '' }]) => {
      const { reminder = true, sound = true } = preference ?? {};
      if ((!reminderTime || !isToday(reminderTime)) && reminder) {
        setItem(chromeStorageKey.reminderTime, new Date().toISOString()).then(() => {
          handleTriggerNotificationModal({
            title: 'Streak reminder',
            message: 'Show off skills by contributing on github 👍',
            sound,
          });
        });
      }
    },
  );
};

const handleTriggerNotificationModal = ({ title, message, sound }) => {
  registration?.showNotification(title, {
    body: message,
    icon: '../../logo.png',
  });
  sound && handlePlaySound();
};

const handlePlaySound = () => {
  const url = chrome.runtime.getURL('audio.html');
  const options = { type: 'popup', focused: false, top: 1, left: 1, height: 1, width: 1, url };

  chrome.windows.create(options).then(({ id }) => {
    const timeoutId = setTimeout(() => {
      chrome.windows.remove(id);
      clearTimeout(timeoutId);
    }, 1000);
  });
};

//Inititalize extension
init();
