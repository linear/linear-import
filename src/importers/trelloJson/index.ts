import { TrelloJsonImporter } from './TrelloJsonImporter';
import * as inquirer from 'inquirer';
import { Importer } from '../../types';

const BASE_PATH = process.cwd();

export const trelloJsonImport = async (): Promise<Importer> => {
  const answers = await inquirer.prompt<TrelloImportAnswers>(questions);
  const trelloImporter = new TrelloJsonImporter(answers.trelloFilePath);
  return trelloImporter;
};

interface TrelloImportAnswers {
  trelloFilePath: string;
}

const questions = [
  {
    basePath: BASE_PATH,
    type: 'filePath',
    name: 'trelloFilePath',
    message: 'Select your exported JSON file of Trello cards',
  },
];
