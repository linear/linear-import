import { jiraCsvImport } from './importers/jiraCsv/index';
import * as inquirer from 'inquirer';
import { ImportAnswers } from './types';
import { githubImport } from './importers/github';
import chalk from 'chalk';
import { importIssues } from './importIssues';

inquirer.registerPrompt('filePath', require('inquirer-file-path'));

(async () => {
  try {
    const importAnswers = await inquirer.prompt<ImportAnswers>([
      {
        type: 'input',
        name: 'linearApiKey',
        message: 'Input your Linear API key (https://linear.app/settings/api)',
      },
      {
        type: 'list',
        name: 'service',
        message: 'Which service would you like to import from?',
        choices: [
          {
            name: 'GitHub',
            value: 'github',
          },
          {
            name: 'Jira (CSV export)',
            value: 'jiraCsv',
          },
        ],
      },
    ]);

    // TODO: Validate Linear API
    let importer;
    switch (importAnswers.service) {
      case 'github':
        importer = await githubImport();
        break;
      case 'jiraCsv':
        importer = await jiraCsvImport();
        break;
      default:
        console.log(chalk.red(`Invalid importer`));
        return;
    }

    if (importer) {
      await importIssues(importAnswers.linearApiKey, importer);
    }
  } catch (e) {
    // Deal with the fact the chain failed
    console.error(e);
  }
})();
