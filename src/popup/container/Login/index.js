import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { regex, error, localStorageKey } from '../../../config';
import { githubLoginApi, getUserContributionApi } from '../../../api';
import { getContributionDates } from '../../../utils/helper';
import { saveState, loadState } from '../../../utils/storage';

import Loader from '../../../components/Loader';
import TextField from '../../../components/TextField';
import Button from '../../../components/Button';
import Toast from '../../../components/Toast';
import Animation from '../../../components/Animation';

import githubIcon from '../../../assets/icons/github-light.svg';
import streakUpLogo from '../../../assets/streakup-logo.svg';
import './Login.css';

const githubIdValidatorPattern = new RegExp(regex.qrValidator);

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [githubId, setGithubId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const userDetails = loadState(localStorageKey?.userDetails);
    if (userDetails !== null) navigate('/home');
  }, []);

  const executeContributionGraphRequests = async (user, years) => {
    const promises = [];

    years.forEach((year) => {
      const start = `${year}-01-01T00:00:00Z`;
      const end = `${year}-12-31T23:59:59Z`;
      promises.push(getUserContributionApi(user, start, end));
    });

    return await Promise.all(promises).then((responses) => {
      const requestResponse = {};
      responses?.forEach((response, index) => {
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
        requestResponse[years[index]] = response;
      });
      return requestResponse;
    });
  };

  const getUserContributionPromise = async (user, startingYear = null) => {
    const currentYear = new Date().getFullYear();
    const responses = await executeContributionGraphRequests(user, [currentYear]);

    const userCreatedDateTimeString = responses[currentYear].data.user.createdAt || null;

    if (!userCreatedDateTimeString) {
      throw new Error('Failed to retrieve contributions. This is likely a GitHub API issue.');
    }

    const userCreatedYear = new Date(userCreatedDateTimeString).getFullYear();

    const minimumYear = startingYear || userCreatedYear;
    const minimumYearAdjusted = Math.max(minimumYear, 2005);

    const yearsToRequest = Array.from(
      { length: currentYear - minimumYearAdjusted },
      (_, i) => minimumYearAdjusted + i,
    );

    const contributionYears =
      responses[currentYear].data.user.contributionsCollection.contributionYears || [];

    const firstContributionYear =
      contributionYears[contributionYears.length - 1] || userCreatedYear;

    if (firstContributionYear < 2005) {
      yearsToRequest.unshift(firstContributionYear);
    }

    const additionalResponses = await executeContributionGraphRequests(user, yearsToRequest);

    return { ...responses, ...additionalResponses };
  };

  const githubLoginPromise = async (githubId) =>
    await githubLoginApi(githubId).then((response) => {
      if (!response || !response?.data || response?.errors) {
        const errorMessage = response?.errors[0]?.message ?? response?.message ?? error?.generic;
        throw new Error(errorMessage);
      }
      return response?.data?.user ?? {};
    });

  const handleLoginOnClick = () => {
    setIsLoading(true);
    setErrorMessage('');
    if (githubId?.length == 0 || !githubIdValidatorPattern.test(githubId)) {
      setIsLoading(false);
      handleError('Please enter a valid github id.');
      return;
    }
    Promise.all([githubLoginPromise(githubId), getUserContributionPromise(githubId)])
      .then(([userDetails, contributionGraphs]) => {
        const contributions = getContributionDates(contributionGraphs);
        const timestamp = new Date().toISOString();

        saveState(localStorageKey?.lasUpdated, timestamp);
        saveState(localStorageKey?.userDetails, userDetails);
        saveState(localStorageKey?.contributions, contributions);

        navigate('/home');
      })
      .catch((error) => handleError(error?.message))
      .finally(() => setIsLoading(false));
  };

  const handleGithubIdOnChange = (event) => {
    const { value } = event.target;
    setGithubId(value);
  };

  const handleError = (errorMessage) => {
    setGithubId('');
    setErrorMessage(errorMessage);
  };

  return (
    <Animation>
      {isLoading && <Loader />}
      <div className="flex flex-column justify-between login">
        <div className="login-header flex flex-column align-center">
          <img className="logo" src={streakUpLogo} alt="streakup-logo" />
          <div className="streak">
            Streak<span className="up">UP</span>
          </div>
        </div>
        <div>
          <TextField
            className="my-20"
            id="githubId"
            name="githubId"
            label="Github ID"
            placeholder="Enter your Github ID"
            autoFocus={true}
            value={githubId}
            error={!!errorMessage}
            onChange={handleGithubIdOnChange}
          />
          <Button
            startIcon={<img src={githubIcon} alt="github-icon" />}
            content="Login"
            onClick={handleLoginOnClick}
          />
          <div className="login-term-condition">
            By using StreakUP you agree to its <a>Terms of Use</a> & <a>Privacy Policy</a>.
          </div>
          <div className="develop-by">
            Developed & Designed by :{' '}
            <a href="https://www.linkedin.com/in/sachinsh97/" target="_blank">
              {'keen_dev_'}
            </a>
            &{' '}
            <a href="https://www.linkedin.com/in/yonal-kumar-bb1138206/" target="_blank">
              {' suspect.ybs '}
            </a>
          </div>
        </div>
      </div>
      <Toast type="error" message={errorMessage} />
    </Animation>
  );
};

export default Login;
