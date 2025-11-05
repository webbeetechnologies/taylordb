import chalk from 'chalk';
import {Command} from 'commander';
import {umsApi} from '../lib/api';
import {getToken} from '../lib/auth';

export const meCommand = new Command('me')
  .description('Get the current logged in user')
  .action(async () => {
    const token = getToken();
    if (!token) {
      console.log(
        chalk.yellow('You are not logged in. Please run "taylordb login"')
      );
      return;
    }

    try {
      const response = await umsApi.post('', {
        query: `
          query {
            user {
              profile {
                name
                email
              }
            }
          }
        `,
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      const {name, email} = response.data.data.user.profile;
      console.log(`Logged in as: ${chalk.green(name)} (${chalk.blue(email)})`);
    } catch (error: any) {
      console.error(chalk.red(`Failed to get user: ${error.message}`));
    }
  });
