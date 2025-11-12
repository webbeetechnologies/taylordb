#!/usr/bin/env node
import { Command } from 'commander';
import { generateSchemaCommand } from './commands/generate-schema.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { meCommand } from './commands/me.js';

const program = new Command();

program.name('taylordb').description('CLI for TaylorDB').version('0.1.0');

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(meCommand);
program.addCommand(generateSchemaCommand);

program.parse(process.argv);
