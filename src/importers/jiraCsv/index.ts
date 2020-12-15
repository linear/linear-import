import { JiraCsvImporter } from './JiraCsvImporter';
import * as inquirer from 'inquirer';
import { Importer } from '../../types';

const BASE_PATH = process.cwd();

const JIRA_URL_REGEX = /^https?:\/\/(\S+).atlassian.net/;

export const jiraCsvImport = async (): Promise<Importer> => {
  const answers = await inquirer.prompt<JiraImportAnswers>(questions);
  let orgSlug = '';
  if (answers.jiraUrlName) {
    orgSlug = answers.jiraUrlName.match(JIRA_URL_REGEX)![1];
  }
  const jiraImporter = new JiraCsvImporter(
    answers.jiraFilePath,
    orgSlug,
    answers.customJiraUrl
  );
  return jiraImporter;
};

interface JiraImportAnswers {
  jiraFilePath: string;
  customJiraUrl: string;
  jiraUrlName: string;
}

const questions = [
  {
    basePath: BASE_PATH,
    type: 'filePath',
    name: 'jiraFilePath',
    message: 'Select your exported CSV file of Jira issues',
  },
  {
    type: 'input',
    name: 'customJiraUrl',
    message:
      'Input the URL of your Jira installation if it is on-prem (e.g. https://jira.mydomain.com), or leave blank if not:',
  },
  {
    type: 'input',
    name: 'jiraUrlName',
    message:
      'Input the URL of your Jira installation (e.g. https://acme.atlassian.net):',
    validate: (input: string) => {
      return input === '' || !!input.match(JIRA_URL_REGEX);
    },
  },
];
