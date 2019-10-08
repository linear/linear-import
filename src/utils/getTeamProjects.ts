interface Team {
  id: string;
  name: string;
  key: string;
  projects: {
    id: string;
    name: string;
    key: string;
  }[];
}

/**
 * Given a list of teams and a team id, get the list of projects
 * associated with that team.
 *
 * @param teamId id of the team to get projects from
 * @param teams list of teams to check for the given team id
 *
 * @returns list of projects for the given team
 */
export const getTeamProjects = (teamId: string, teams: Team[]) => {
  const teamIndex = teams.findIndex(team => team.id === teamId);
  const projects = teamIndex >= 0 ? teams[teamIndex].projects : [];
  return projects;
};
