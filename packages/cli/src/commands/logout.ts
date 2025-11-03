import {Command} from 'commander';
import chalk from 'chalk';
import {authApi} from '../lib/api';
import {clearToken, getToken} from '../lib/auth';

export const logoutCommand = new Command('logout')
  .description('Log out from TaylorDB')
  .action(async () => {
    const token = getToken();
    if (!token) {
      console.log(chalk.yellow('You are not logged in.'));
      return;
    }

    try {
      await authApi.post(
        '',
        {
          query: `
            mutation {
              auth {
                logout(filters:{device: THIS})
              }
            }
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      clearToken();
      console.log(chalk.green('Logout successful!'));
    } catch (error: any) {
      console.error(chalk.red(`Logout failed: ${error.message}`));
    }
  });
