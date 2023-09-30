export const loadState = (key) => {
  try {
    const serializedState = localStorage?.getItem(key);
    if (serializedState == null) return null;
    return JSON.parse(serializedState);
  } catch (error) {
    console.error(error);
  }
};

export const saveState = (key, value) => {
  try {
    const serializedState = JSON.stringify(value);
    localStorage?.setItem(key, serializedState);
  } catch (error) {
    console.error(error);
  }
};

export const removeState = (key) => {
  try {
    if (!key) return;
    localStorage?.removeItem(key);
  } catch (error) {
    console.error(error);
  }
};
