import { githubAnswers, githubImport } from './importers/github';
import { jiraImport, jiraAnswers } from './importers/jira';
import {
  getDescription,
  getLink,
  getPriority,
  getProjectName,
  getTitle,
} from './utils';
import {
  GithubImportAnswers,
  JiraImportAnswers,
  ServiceAnswers,
} from './types';
import linearClient from './client';
import * as inquirer from 'inquirer';
import chalk from 'chalk';

inquirer.registerPrompt('filePath', require('inquirer-file-path'));

(async () => {
  try {
    const { service } = await inquirer.prompt<ServiceAnswers>([
      {
        type: 'list',
        name: 'service',
        choices: ['Jira', 'GitHub'],
        message: 'What issue tracking service are you importing from?',
      },
    ]);

    let issues, answers;

    switch (service) {
      case 'Jira':
        answers = await inquirer.prompt<JiraImportAnswers>(jiraAnswers);
        issues = await jiraImport(answers.jiraFilePath);
        break;
      case 'GitHub':
        answers = await inquirer.prompt<GithubImportAnswers>(githubAnswers);
        const [owner, repo] = answers.repo.split('/');
        issues = await githubImport(answers.githubApiKey, owner, repo);
        break;
      default:
        throw new Error('Invalid service type');
    }

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
          name: getProjectName(answers, issues, service),
        }
      );

      for (const issue of issues) {
        const description = getDescription(issue, service);
        const link = getLink(answers, issue, service);
        const priority = getPriority(issue, service);
        const title = getTitle(issue, service);

        await linear(
          `
          mutation createIssuesTeam($description: String, $priority: Float, $teamId: String!, $title: String!) {
            issueCreate(input: { description: $description, priority: $priority, teamId: $teamId, title: $title }) {
              success
            }
          }
        `,
          {
            description: `${description}\n\n---\n\n[View original issue on ${service}](${link})`,
            priority,
            teamId: teamResponse.teamCreate.team.id,
            title,
          }
        );
      }
      const teamKey = teamResponse.teamCreate.team.key;
      console.error(
        chalk.green(
          `${service} issues imported to your backlog: https://linear.app/team/${teamKey}/backlog`
        )
      );
    }
  } catch (e) {
    // Deal with the fact the chain failed
    console.error(e);
  }
})();
