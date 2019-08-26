export interface ServiceAnswers {
  service: string;
}
export interface GithubImportAnswers {
  githubApiKey: string;
  linearApiKey: string;
  repo: string;
}

export interface JiraImportAnswers {
  jiraFilePath: string;
  jiraProjectName: string;
  linearApiKey: string;
}

export interface JiraIssueType {
  Description: string;
  'Issue key': string;
  'Project key': string;
  Summary: string;
}

export interface GitHubIssueType {
  key: string;
  title: string;
  body: string;
  url: string;
}

export interface JiraIssuesType {
  '0': JiraIssueType;
}
