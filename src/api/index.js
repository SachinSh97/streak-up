import { githubToken, baseApiUrl, chromeStorageKey } from '../config';
import { getItem, removeItem } from '../background/helper';
import { userDetailsGraphQuery, userContributionGraphQuery } from '../graphql/queries';

/** Create a promise for a post request to Github's GraphQL API
 *
 * @param {string} query
 * @param {string} token
 * @returns {Promise} The promise for the request
 */
const getGraphQLFetchPromise = async (query, options) => {
  const userToken = await getItem(chromeStorageKey.token);
  const userOrigin = await getItem(chromeStorageKey.origin);

  const token = userToken?.token ?? githubToken ?? '';
  const origin = userOrigin?.origin ?? baseApiUrl ?? '';

  const headers = {
    Authorization: `bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github.v4.idl',
    'User-Agent': '*',
  };
  const body = JSON.stringify({ query });
  const requestOptions = { method: 'POST', headers, body, ...options };

  if (navigator?.onLine) {
    return await fetch(`${origin}/graphql`, requestOptions)?.then((response) => {
      if (!response.ok) {
        return response.json().then((error) => {
          if (error?.message?.toLowerCase() === 'bad credentials') {
            removeItem(chromeStorageKey.token);
            throw new Error('Seems like there is some issue with token!');
          }
          throw new Error(error?.message);
        });
      }
      return response.json();
    });
  } else {
    throw new Error('No internet connection!');
  }
};

/** Create a promise for a post request to Github's GraphQL API
 *
 * @param {string} query
 * @param {string} token
 * @returns {Promise} The promise for the request
 */
const getRestFetchPromise = async (url, options) => {
  const userToken = await getItem(chromeStorageKey.token);
  const userOrigin = await getItem(chromeStorageKey.origin);

  const token = userToken?.token ?? githubToken ?? '';
  const origin = userOrigin?.origin ?? baseApiUrl ?? '';

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  const requestOptions = { method: 'GET', headers, ...options };

  if (navigator?.onLine) {
    return await fetch(`${origin}/${url}`, requestOptions)?.then((response) => {
      if (!response.ok) {
        return response.json().then((error) => {
          if (error?.message?.toLowerCase() === 'bad credentials') {
            removeItem(chromeStorageKey.token);
            throw new Error('Seems like there is some issue with token!');
          }
          throw new Error(error?.message);
        });
      }
      return response.json();
    });
  } else {
    throw new Error('No internet connection!');
  }
};

export const githubLoginApi = async (userId) => {
  const query = userDetailsGraphQuery(userId);
  return await getGraphQLFetchPromise(query);
};

export const getUserContributionApi = async (userId, start, end) => {
  const query = userContributionGraphQuery(userId, start, end);
  return await getGraphQLFetchPromise(query);
};

export const getUserNotificationApi = async (params) => {
  const searchString = !!params?.since ? `&since=${params?.since}` : '';
  return await getRestFetchPromise(
    `notifications?participating=true&page=1&per_page=100${searchString}`,
    params,
  );
};
