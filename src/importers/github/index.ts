#!/usr/bin/env node
import fetch from 'node-fetch';
import chalk from 'chalk';

const GITHUB_API = 'https://api.github.com/graphql';

interface GITHUB_ISSUE {
  title: string;
  body: string;
  url: string;
  id: string;
}

/**
 * Fetch and paginate through all Github issues.
 *
 * @param apiKey GitHub api key for authentication
 */
export const githubImport = async (
  apiKey: string,
  owner: string,
  repo: string
) => {
  let issueData: GITHUB_ISSUE[] = [];
  let cursor = undefined;

  while (true) {
    try {
      const res = (await fetch(GITHUB_API, {
        method: 'POST',
        headers: {
          authorization: `token ${apiKey}`,
        },
        body: JSON.stringify({
          query: `query lastIssues($owner: String!, $repo: String!, $num: Int, $cursor: String) {
            repository(owner:$owner, name:$repo) {
              issues(first:$num, after: $cursor, states:OPEN) {
                edges {
                  node {
                    id
                    title
                    body
                    url
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }`,
          variables: {
            owner,
            repo,
            num: 25,
            cursor,
          },
        }),
      }).then(res => res.json())) as any;

      // GitHub error message
      if (res.message) {
        console.error(chalk.red(`GitHub: ${res.message}`));
        return;
      }

      // User didn't select repo scope
      if (!res.data.repository) {
        console.error(
          chalk.red(
            `Unable to find repo ${owner}/${repo}. Did you select \`repo\` scope for your GitHub token?`
          )
        );
        return;
      }

      cursor = res.data.repository.issues.pageInfo.endCursor;
      const fetchedIssues = res.data.repository.issues.edges.map(
        (data: any) => data.node
      ) as GITHUB_ISSUE[];
      issueData = issueData.concat(fetchedIssues);

      if (!res.data.repository.issues.pageInfo.hasNextPage) {
        break;
      }
    } catch (err) {
      console.error(err);
    }
  }

  return issueData;
};

export const githubAnswers = [
  {
    type: 'input',
    name: 'githubApiKey',
    message:
      'Input your personal GitHub access token (https://github.com/settings/tokens, select `repo` scope)',
  },
  {
    type: 'input',
    name: 'linearApiKey',
    message:
      'Input your Linear API key (https://linear.app/settings/developer-keys)',
  },
  {
    type: 'input',
    name: 'repo',
    message:
      'From which repo do you want to import issues from (e.g. "facebook/react")',
  },
];
