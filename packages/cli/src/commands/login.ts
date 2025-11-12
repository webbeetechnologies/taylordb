import { input, password } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { umsApi } from '../lib/api.js';
import { setToken } from '../lib/auth.js';

export const loginCommand = new Command('login')
  .description('Authenticate with TaylorDB')
  .action(async () => {
    const email = await input({ message: 'Enter your email' });
    const pass = await password({ message: 'Enter your password', mask: true });

    try {
      const response = await umsApi.post('', {
        query: `
          mutation Login($email: String!, $password: String!) {
            auth {
              login(payload: {
                email: $email
                password: $password
              }) {
                accessToken {
                  token
                  expires_at
                }
                user {
                  name
                  id
                  email
                }
              }
            }
          }
        `,
        variables: {
          email,
          password: pass,
        },
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      const { token } = response.data.data.auth.login.accessToken;
      setToken(token);
      console.log(chalk.green('Login successful!'));
    } catch (error: any) {
      console.error(chalk.red(`Login failed: ${error.message}`));
    }
  });
