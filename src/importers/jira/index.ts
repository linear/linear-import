const csv = require('csvtojson');
export const BASE_PATH = '/';

export const jiraImport = async (filePath: string) => {
  return csv().fromFile(BASE_PATH + filePath);
};

export const jiraAnswers = [
  {
    basePath: BASE_PATH,
    type: 'filePath',
    name: 'jiraFilePath',
    message: 'Input the relative path to your exported CSV file of Jira issues',
  },
  {
    type: 'input',
    name: 'jiraProjectName',
    message: 'Input the name of your Jira project: ',
  },
  {
    type: 'input',
    name: 'linearApiKey',
    message:
      'Input your Linear API key (https://linear.app/settings/developer-keys): ',
  },
];
