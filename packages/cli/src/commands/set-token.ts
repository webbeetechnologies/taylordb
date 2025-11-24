import { Command } from 'commander';
import { setToken } from '../lib/auth';
import chalk from 'chalk';

export const setTokenCommand = new Command('set-token')
  .description('Set the authorization token directly')
  .argument('<token>', 'The authorization token')
  .action((token: string) => {
    setToken(token);
    console.log(chalk.green('Authorization token set successfully!'));
  });
