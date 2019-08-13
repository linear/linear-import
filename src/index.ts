import { githubImport } from './importers/github';
import linearClient from './client';
import * as inquirer from 'inquirer';
import chalk from 'chalk';

interface GithubImportAnswers {
  githubApiKey: string;
  linearApiKey: string;
  repo: string;
}

(async () => {
  try {
    const answers = await inquirer.prompt<GithubImportAnswers>([
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
        message: 'From which repo do you want to import issues from',
        default: 'facebook/react',
      },
    ]);

    const [owner, repo] = answers.repo.split('/');
    const issues = await githubImport(answers.githubApiKey, owner, repo);

    if (issues) {
      const linear = linearClient(answers.linearApiKey);

      // Create a new team
      const teamResponse = await linear(
        `
        mutation createIssuesTeam($name: String!) {
          teamCreate(input: { name: $name }) {
            success
            team {
              id
              name
              key
            }
          }
        }
      `,
        {
          name: repo,
        }
      );

      for (const issue of issues) {
        await linear(
          `
          mutation createIssuesTeam($teamId: String!, $title: String!, $description: String) {
            issueCreate(input: { title: $title, description: $description, teamId: $teamId }) {
              success
            }
          }
        `,
          {
            teamId: teamResponse.teamCreate.team.id,
            title: issue.title,
            description: `${issue.body}\n\n---\n\n[View original issue on GitHub](${issue.url})`,
          }
        );
      }
      const teamKey = teamResponse.teamCreate.team.key;
      console.error(
        chalk.green(
          `GitHub issues imported to your backlog: https://linear.app/team/${teamKey}/backlog`
        )
      );
    }
  } catch (e) {
    // Deal with the fact the chain failed
    console.error(e);
  }
})();
