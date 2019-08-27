import { Importer } from './types';
import linearClient from './client';
import chalk from 'chalk';

/**
 * Import issues into Linear via the API.
 */
export const importIssues = async (apiKey: string, importer: Importer) => {
  const linear = linearClient(apiKey);
  const importData = await importer.import();

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
      name: importer.defaultTeamName || 'Imported issues', // TODO: Swap to a prompt
    }
  );

  for (const issue of importData.issues) {
    await linear(
      `
          mutation createIssue($teamId: String!, $title: String!, $description: String) {
            issueCreate(input: { title: $title, description: $description, teamId: $teamId }) {
              success
            }
          }
        `,
      {
        teamId: teamResponse.teamCreate.team.id,
        title: issue.title,
        description: issue.description,
      }
    );
  }
  const teamKey = teamResponse.teamCreate.team.key;
  console.error(
    chalk.green(
      `${importer.name} issues imported to your backlog: https://linear.app/team/${teamKey}/backlog`
    )
  );
};
