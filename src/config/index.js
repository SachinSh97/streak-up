const { REACT_APP_GITHUB_TOKEN, REACT_APP_BASE_API_URL, REACT_APP_GITHUB_URL } = process.env;

export const githubToken = REACT_APP_GITHUB_TOKEN;

export const baseApiUrl = REACT_APP_BASE_API_URL;

export const githubUrl = REACT_APP_GITHUB_URL;

export const regex = {
  githubId: '^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$',
};

export const contributionRefreshDuration = 300000;

export const notificationRefreshDurationInMin = 1;

export const localStorageKey = {
  userDetails: 'user_details',
  contributions: 'contributions',
  lasUpdated: 'last_updated',
};

export const chromeStorageKey = {
  origin: 'origin',
  token: 'token',
  notifications: 'notifications',
  preference: 'preference',
  reminderTime: 'reminderTime',
};

export const dateFormats = {
  formatOne: { month: 'short', day: 'numeric' },
  formatTwo: { month: 'short', day: 'numeric', year: 'numeric' },
  formatThree: {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  },
};

export const events = {
  notifications: 'notification',
};

export const error = {
  generic: 'An api error occurred',
};
