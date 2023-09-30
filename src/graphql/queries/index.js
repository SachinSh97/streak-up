/**
 * Build a GraphQL query for a contribution graph
 *
 * @param string user GitHub username to get graphs for
 * @return string GraphQL query
 */
export const userDetailsGraphQuery = (user) => {
  return `query {
      user(login: "${user}") {
        login
        name
        location
        followers {
          totalCount
        }
        following {
          totalCount
        }
      }
    }`;
};

/**
 * Build a GraphQL query for a contribution graph
 *
 * @param string user GitHub username to get graphs for
 * @param int year Year to get graph for
 * @return string GraphQL query
 */
export const userContributionGraphQuery = (user, start, end) => {
  return `query {
        user(login: "${user}") {
          createdAt
          contributionsCollection(from: "${start}", to: "${end}") {
            contributionYears
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }`;
};
