#!/usr/bin/env node
import {Command} from 'commander';
import {loginCommand} from './commands/login';
import {logoutCommand} from './commands/logout';
import {meCommand} from './commands/me';

const program = new Command();

program.name('taylordb').description('CLI for TaylorDB').version('0.1.0');

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(meCommand);

program.parse(process.argv);
