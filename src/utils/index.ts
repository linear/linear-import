import { JiraIssueType, JiraIssuesType, GitHubIssueType } from '../types';
type IssueType = GitHubIssueType & JiraIssueType;
type Service = 'GitHub' | 'Jira';

// Jira Fields
// -----------
// Done ✅
// - Summary
// - Description
// - Priority
// Todo 🚨
// - Labels
// - Assignees
// - Creation date
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

export const getTitle = (issue: IssueType, service: Service) => {
  switch (service) {
    case 'GitHub':
      return issue.title;
    case 'Jira':
      return issue.Summary;
    default:
      return 'No title';
  }
};

export const getDescription = (issue: IssueType, service: Service) => {
  switch (service) {
    case 'GitHub':
      return issue.body;
    case 'Jira':
      return issue.Description;
    default:
      return '';
  }
};

export const getLink = (answers: any, issue: IssueType, service: Service) => {
  switch (service) {
    case 'GitHub':
      return issue.url;
    case 'Jira':
      return `https://${answers.jiraProjectName}.atlassian.net/browse/${issue['Issue key']}`;
    default:
      return null;
  }
};

export const getPriority = (issue: IssueType, service: Service) => {
  switch (service) {
    case 'Jira':
      const priorityMap = {
        Highest: 1,
        High: 2,
        Medium: 3,
        Low: 4,
        Lowest: 0,
      };
      return priorityMap[issue.Priority] || 0;
    default:
      return 0;
  }
};
