#!/usr/bin/env node

import { Command } from 'commander';
import { generateSchemaCommand } from './commands/generate-schema';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { meCommand } from './commands/me';
import { setTokenCommand } from './commands/set-token';

const program = new Command();

program.name('taylordb').description('CLI for TaylorDB').version('0.6.9');

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(meCommand);
program.addCommand(generateSchemaCommand);
program.addCommand(setTokenCommand);

program.parse(process.argv);
