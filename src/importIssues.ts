import { GraphQLClientRequest } from './client/types';
import { replaceImagesInMarkdown } from './utils/replaceImages';
import { Importer, ImportResult, Comment } from './types';
import linearClient from './client';
import chalk from 'chalk';
import * as inquirer from 'inquirer';

interface ImportAnswers {
  newTeam: boolean;
  teamName?: string;
  targetTeamId?: string;
  includeComments?: boolean;
}

interface TeamsResponse {
  teams: { id: string; name: string; key: string }[];
}

interface LabelCreateResponse {
  issueLabelCreate: {
    issueLabel: {
      id: string;
    };
    success: boolean;
  };
}

/**
 * Import issues into Linear via the API.
 */
export const importIssues = async (apiKey: string, importer: Importer) => {
  const linear = linearClient(apiKey);
  const importData = await importer.import();

  const teams = ((await linear(`query {
    teams {
      id
      name
      key
    }
  }`)) as TeamsResponse).teams;

  const importAnswers = await inquirer.prompt<ImportAnswers>([
    {
      type: 'confirm',
      name: 'newTeam',
      message: 'Do you want to create a new team for imported issues?',
      default: true,
    },
    {
      type: 'input',
      name: 'teamName',
      message: 'Name of the team:',
      default: importer.defaultTeamName || importer.name,
      when: answers => {
        return answers.newTeam;
      },
    },
    {
      type: 'list',
      name: 'targetTeamId',
      message: 'Import into team:',
      choices: async () => {
        return teams.map((team: { id: string; name: string; key: string }) => ({
          name: `[${team.key}] ${team.name}`,
          value: team.id,
        }));
      },
      when: answers => {
        return !answers.newTeam;
      },
    },
    {
      type: 'confirm',
      name: 'includeComments',
      message: 'Do you want to include comments in the issue description?',
      when: () => {
        return !!importData.issues.find(
          issue => issue.comments && issue.comments.length > 0
        );
      },
    },
  ]);

  let teamKey: string;
  let teamId: string;
  if (importAnswers.newTeam) {
    // Create a new team
    const teamResponse = await linear(
      `mutation createIssuesTeam($name: String!) {
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
        name: importAnswers.teamName as string,
      }
    );
    teamKey = teamResponse.teamCreate.team.key;
    teamId = teamResponse.teamCreate.team.id;
  } else {
    // Use existing team
    teamKey = teams.find(team => team.id === importAnswers.targetTeamId)!.key;
    teamId = importAnswers.targetTeamId as string;
  }

  // Create labels and mapping to source data
  const labelMapping = {} as { [id: string]: string };
  for (const labelId of Object.keys(importData.labels)) {
    const label = importData.labels[labelId];
    const labelResponse = (await linear(
      `
        mutation createLabel($teamId: String!, $name: String!, $description: String, $color: String) {
          issueLabelCreate(input: { name: $name, description: $description, color: $color, teamId: $teamId }) {
            issueLabel {
              id
            }
            success
          }
        }
      `,
      {
        name: label.name,
        description: label.description,
        color: label.color,
        teamId,
      }
    )) as LabelCreateResponse;

    labelMapping[labelId] = labelResponse.issueLabelCreate.issueLabel.id;
  }

  // Create issues
  for (const issue of importData.issues) {
    const issueDescription = issue.description
      ? await replaceImagesInMarkdown(linear, issue.description)
      : undefined;

    const description =
      importAnswers.includeComments && issue.comments
        ? await buildComments(
            linear,
            issueDescription || '',
            issue.comments,
            importData
          )
        : issueDescription;
    const labelIds = issue.labels
      ? issue.labels.map(labelId => labelMapping[labelId])
      : undefined;

    await linear(
      `
          mutation createIssue(
              $teamId: String!,
              $title: String!,
              $description: String,
              $priority: Int,
              $labelIds: [String!]
            ) {
            issueCreate(input: {
                                title: $title,
                                description: $description,
                                priority: $priority,
                                teamId: $teamId,
                                labelIds: $labelIds
                              }) {
              success
            }
          }
        `,
      {
        teamId,
        title: issue.title,
        description,
        priority: issue.priority,
        labelIds,
      }
    );
  }

  console.error(
    chalk.green(
      `${importer.name} issues imported to your backlog: https://linear.app/team/${teamKey}/backlog`
    )
  );
};

// Build comments into issue description
const buildComments = async (
  client: GraphQLClientRequest,
  description: string,
  comments: Comment[],
  importData: ImportResult
) => {
  const newComments: string[] = [];
  for (const comment of comments) {
    const user = importData.users[comment.userId];
    const date = comment.createdAt
      ? comment.createdAt.toISOString().split('T')[0]
      : undefined;

    const body = await replaceImagesInMarkdown(client, comment.body || '');
    newComments.push(`**${user.name}**${' ' + date}\n\n${body}\n`);
  }
  return `${description}\n\n---\n\n${newComments.join('\n\n')}`;
};
