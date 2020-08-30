import { TrelloJsonImporter } from './TrelloJsonImporter';
import * as inquirer from 'inquirer';
import { Importer } from '../../types';

const BASE_PATH = process.cwd();

export const trelloJsonImport = async (): Promise<Importer> => {
  const answers = await inquirer.prompt<TrelloImportAnswers>(questions);
  const trelloImporter = new TrelloJsonImporter(
    answers.trelloFilePath,
    answers.importArchived
  );
  return trelloImporter;
};

interface TrelloImportAnswers {
  trelloFilePath: string;
  importArchived: boolean;
}

const questions = [
  {
    basePath: BASE_PATH,
    type: 'filePath',
    name: 'trelloFilePath',
    message: 'Select your exported JSON file of Trello cards',
  },
  {
    type: 'confirm',
    name: 'importArchived',
    message: 'Would you like to import the archived cards as well?',
    default: true,
  },
];
