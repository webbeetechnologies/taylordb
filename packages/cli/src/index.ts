#!/usr/bin/env node
import chalk from 'chalk';
import {Command} from 'commander';

const program = new Command();

program
  .command('login')
  .description('Authenticate with TaylorDB')
  .action(() => {
    console.log(chalk.green('Logging in...'));
    // Add login logic here
  });

program.parse(process.argv);
