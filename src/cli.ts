import chalk from 'chalk';
import * as inquirer from 'inquirer';
import { ImportAnswers } from './types';
import { importIssues } from './importIssues';
import { githubImport } from './importers/github';
import { jiraCsvImport } from './importers/jiraCsv';
import { asanaCsvImport } from './importers/asanaCsv';
import { pivotalCsvImport } from './importers/pivotalCsv';

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
          {
            name: 'Asana (CSV export)',
            value: 'asanaCsv',
          },
          {
            name: 'Pivotal (CSV export)',
            value: 'pivotalCsv',
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
      case 'asanaCsv':
        importer = await asanaCsvImport();
        break;
      case 'pivotalCsv':
        importer = await pivotalCsvImport();
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
