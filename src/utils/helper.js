import { dateFormats } from '../config';

export const isToday = (targetDate) => {
  const today = new Date();
  const date = new Date(targetDate);

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};
export const formatLocalDateTime = (dateTimeString, format) => {
  if (!dateTimeString) return '';
  const dateTime = new Date(dateTimeString);
  const formattedDateTime = dateTime.toLocaleString(navigator.language, { ...format });
  return formattedDateTime;
};

/** use to format a given number in 1k or 1m.
 *
 * @param {number} number number to be formated in k, m format
 */
export const formatNumber = (number) => {
  if (number < 10) return `0${number}`;
  if (number < 1000) return number.toString();
  if (number < 1000000) return `${Math.round((number / 1000 + Number.EPSILON) * 10) / 10}k`;
  return `${Math.round((number / 1000000 + Number.EPSILON) * 10) / 10}m`;
};

/** use to format a given date.
 *
 * @param {string} number date to be formated in
 */
export const formateDate = (targetDate) => {
  let now = new Date();
  let date = new Date(targetDate);
  let timeDifference = now - date;

  // For dates within the last minute
  if (timeDifference < 60000) {
    return 'a moment ago';
  }
  // For dates within the last hour
  else if (timeDifference < 3600000) {
    var minutes = Math.floor(timeDifference / 60000);
    return minutes + ' minute' + (minutes > 1 ? 's' : '') + ' ago';
  }
  // For dates within the last 24 hours
  else if (timeDifference < 86400000) {
    var hours = Math.floor(timeDifference / 3600000);
    return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
  }
  // For later dates, show month, day, year, and time
  else {
    return formatLocalDateTime(targetDate, dateFormats.formatThree);
  }
};

/** Get an array of all dates with the number of contributions
 *
 * @param {Array} contributionGraphs
 * @returns
 */
export const getContributionDates = (contributionGraphs) => {
  const contributions = {};
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];

  // Sort contribution graphs by year
  const contributionYears = Object.keys(contributionGraphs);
  contributionYears.sort((a, b) => a - b);

  contributionYears?.forEach((contributionYear) => {
    const weeks =
      contributionGraphs?.[contributionYear]?.data?.user?.contributionsCollection
        ?.contributionCalendar?.weeks;

    weeks?.forEach((week) => {
      week?.contributionDays?.forEach((day) => {
        const date = day.date;
        const count = day?.contributionCount;

        // Count contributions up until today and include the next day if user has already contributed
        if (date <= today || (date === tomorrowISO && count > 0)) {
          contributions[date] = count;
        }
      });
    });
  });

  return contributions;
};

/**
 * Check if a day is an excluded day of the week
 *
 * @param {string} date Date to check (Y-m-d)
 * @param {Array<string>} excludedDays List of days of the week to exclude
 * @return {boolean} True if the day is excluded, false otherwise
 */
export const isExcludedDay = (date, excludedDays) => {
  if (excludedDays.length === 0) {
    return false;
  }
  const day = new Date(date).toLocaleString('en-US', { weekday: 'short' });
  return excludedDays.includes(day);
};

/** Get a stats array with the contribution count, daily streak, and dates
 *
 * @param {Array<string,int>} contributions Y-M-D contribution dates with contribution counts
 * @param {Array<string>} excludedDays List of days of the week to exclude
 * @return {Array<string,mixed>} Streak stats
 */
export const getContributionStats = (contributions, excludedDays = []) => {
  if (Object.keys(contributions).length === 0) {
    throw new Error('No contributions found.');
  }

  const today = Object.keys(contributions)[Object.keys(contributions).length - 1];
  const first = Object.keys(contributions)[0];

  const stats = {
    mode: 'daily',
    totalContributions: 0,
    firstContribution: '',
    longestStreak: {
      start: first,
      end: first,
      length: 0,
    },
    currentStreak: {
      start: first,
      end: first,
      length: 0,
    },
    excludedDays: excludedDays,
  };

  for (const date in contributions) {
    const count = contributions[date];
    stats.totalContributions += count;

    if (count > 0 || (stats.currentStreak.length > 0 && isExcludedDay(date, excludedDays))) {
      ++stats.currentStreak.length;
      stats.currentStreak.end = date;

      if (stats.currentStreak.length === 1) {
        stats.currentStreak.start = date;
      }

      if (!stats.firstContribution) {
        stats.firstContribution = date;
      }

      if (stats.currentStreak.length > stats.longestStreak.length) {
        stats.longestStreak.start = stats.currentStreak.start;
        stats.longestStreak.end = stats.currentStreak.end;
        stats.longestStreak.length = stats.currentStreak.length;
      }
    } else if (date !== today) {
      stats.currentStreak.length = 0;
      stats.currentStreak.start = today;
      stats.currentStreak.end = today;
    }
  }

  return stats;
};
