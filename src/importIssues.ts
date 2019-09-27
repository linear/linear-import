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

interface QueryResponse {
  teams: {
    id: string;
    name: string;
    key: string;
  }[];
  users: {
    id: string;
    name: string;
  }[];
}

interface TeamInfoResponse {
  team: {
    issueLabels: {
      id: string;
      name: string;
    }[];
    states: {
      id: string;
      name: string;
    }[];
  };
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

  const queryInfo = (await linear(`query {
    teams {
      id
      name
      key
    }
    users {
      id
      name
    }
  }`)) as QueryResponse;

  const teams = queryInfo.teams;
  const users = queryInfo.users;

  // Prompt the user to either get or create a team
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

  const teamInfo = (await linear(`query {
    team(id: "${teamId}") {
      issueLabels {
        id
        name
      }
      states {
        id
        name
      }
    }
  }`)) as TeamInfoResponse;

  const issueLabels = teamInfo.team.issueLabels;
  const workflowStates = teamInfo.team.states;

  const existingLabelMap = {} as { [name: string]: string };
  for (const label of issueLabels) {
    const labelName = label.name.toLowerCase();
    if (!existingLabelMap[labelName]) {
      existingLabelMap[labelName] = label.id;
    }
  }

  // Create labels and mapping to source data
  const labelMapping = {} as { [id: string]: string };
  for (const labelId of Object.keys(importData.labels)) {
    const label = importData.labels[labelId];
    let actualLabelId = existingLabelMap[label.name];

    if (!actualLabelId) {
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

      actualLabelId = labelResponse.issueLabelCreate.issueLabel.id;
    }
    labelMapping[labelId] = actualLabelId;
  }

  const existingStateMap = {} as { [name: string]: string };
  for (const state of workflowStates) {
    const stateName = state.name.toLowerCase();
    if (!existingStateMap[stateName]) {
      existingStateMap[stateName] = state.id;
    }
  }

  const existingUserMap = {} as { [name: string]: string };
  for (const user of users) {
    const userName = user.name.toLowerCase();
    if (!existingUserMap[userName]) {
      existingUserMap[userName] = user.id;
    }
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
      ? issue.labels.map(labelId => labelMapping[labelId.toLowerCase()])
      : undefined;

    const stateId = !!issue.status
      ? existingStateMap[issue.status.toLowerCase()]
      : undefined;

    const assigneeId = !!issue.assigneeId
      ? existingUserMap[issue.assigneeId.toLowerCase()]
      : undefined;

    await linear(
      `
          mutation createIssue(
              $teamId: String!,
              $title: String!,
              $description: String,
              $priority: Int,
              $labelIds: [String!]
              $stateId: String
              $assigneeId: String
            ) {
            issueCreate(input: {
                                title: $title,
                                description: $description,
                                priority: $priority,
                                teamId: $teamId,
                                labelIds: $labelIds
                                stateId: $stateId
                                assigneeId: $assigneeId
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
        stateId,
        assigneeId,
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
