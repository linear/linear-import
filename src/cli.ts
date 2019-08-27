import * as inquirer from 'inquirer';
import { ImportAnswers } from './types';
import { githubImport } from './importers/github';
import chalk from 'chalk';
import { importIssues } from 'importIssues';

(async () => {
  try {
    const importAnswers = await inquirer.prompt<ImportAnswers>([
      {
        type: 'input',
        name: 'linearApiKey',
        message:
          'Input your Linear API key (https://linear.app/settings/developer-keys)',
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
        importer = await githubImport()
        break;
      default:
        console.log(chalk.red(`Invalid importer`));
        return 
    }
    
    if (importer) {
      await importIssues(importAnswers.linearApiKey, importer);
    }
  } catch (e) {
    // Deal with the fact the chain failed
    console.error(e);
  }
})();
.