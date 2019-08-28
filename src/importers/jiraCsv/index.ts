import { JiraCsvImporter } from './JiraCsvImporter';
import * as inquirer from 'inquirer';
import { Importer } from '../../types';

const BASE_PATH = process.cwd();
inquirer.registerPrompt('filePath', require('inquirer-file-path'));

const JIRA_URL_REGEX = /^https?:\/\/(\S+).atlassian.net/;

export const jiraCsvImport = async (): Promise<Importer> => {
  const answers = await inquirer.prompt<JiraImportAnswers>(questions);
  const jiraImporter = new JiraCsvImporter(answers.jiraFilePath);
  return jiraImporter;
};

interface JiraImportAnswers {
  jiraFilePath: string;
  jiraProjectName: string;
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
    name: 'jiraProjectName',
    message: 'Input the name of your Jira project: ',
  },
  {
    type: 'input',
    name: 'jiraUrlName',
    message:
      'Input the URL of your Jira installation (e.g. https://acme.atlassian.net): ',
    validate: (input: string) => {
      return !!input.match(JIRA_URL_REGEX);
    },
  },
];
