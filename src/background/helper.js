export const setItem = async (key, value) => {
  try {
    const dataToStore = {};
    dataToStore[key] = value;
    return await chrome.storage.local.set(dataToStore);
  } catch (error) {
    throw new Error(error?.message ?? 'Something went wrong!');
  }
};

export const getItem = async (key) => {
  try {
    return await chrome.storage.local.get(key);
  } catch (error) {
    throw new Error(error?.message ?? 'Something went wrong!');
  }
};

export const removeItem = async (key) => {
  try {
    return await chrome.storage.local.remove(key);
  } catch (error) {
    throw new Error(error?.message ?? 'Something went wrong!');
  }
};

export const handleSetBadge = (text = '', textColor, bgColor) => {
  chrome.action.setBadgeText({ text });
  textColor && chrome.action.setBadgeTextColor({ color: textColor });
  bgColor && chrome.action.setBadgeBackgroundColor({ color: bgColor });
};
