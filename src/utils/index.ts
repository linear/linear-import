import { JiraIssueType, JiraIssuesType, GitHubIssueType } from '../types';
type Service = 'GitHub' | 'Jira';

// Done ✅
// - Summary -> title
// - Description -> description

// Todo 🚨
// - Labels
// - Assignees
// - Creation date
// - Priority
// - Potentially comments in some form
// - Epic -> Project
// - Story points

export const getProjectName = (
  answers: any,
  issues: JiraIssuesType,
  service: Service
) => {
  switch (service) {
    case 'GitHub':
      return answers.repo.split('/')[1];
    case 'Jira':
      return issues[0]['Project key'];
    default:
      return 'New Linear Project';
  }
};

export const getTitle = (
  issue: JiraIssueType & GitHubIssueType,
  service: Service
) => {
  switch (service) {
    case 'GitHub':
      return issue.title;
    case 'Jira':
      return issue.Summary;
    default:
      return 'No title';
  }
};

export const getDescription = (
  issue: JiraIssueType & GitHubIssueType,
  service: Service
) => {
  switch (service) {
    case 'GitHub':
      return issue.body;
    case 'Jira':
      return issue.Description;
    default:
      return '';
  }
};

export const getLink = (
  answers: any,
  issue: JiraIssueType & GitHubIssueType,
  service: Service
) => {
  switch (service) {
    case 'GitHub':
      return issue.url;
    case 'Jira':
      return `https://${answers.jiraProjectName}.atlassian.net/browse/${issue['Issue key']}`;
    default:
      return null;
  }
};
