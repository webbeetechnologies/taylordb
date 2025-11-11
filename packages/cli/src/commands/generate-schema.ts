import chalk from 'chalk';
import { Command } from 'commander';
import { EnumType, jsonToGraphQLQuery } from 'json-to-graphql-query';
import * as path from 'path';
import { taylorApi, umsApi } from '../lib/api';
import { AppGetResponse, BambooModelsResponse } from '../lib/types';
import { TaylorTypeGenerator } from '../type-generator/taylor-type-generator';

export const generateSchemaCommand = new Command('generate-schema')
  .description('Generate a schema from a TaylorDB instance')
  .argument('<appUrl>', 'The URL of the TaylorDB application')
  .argument('<output>', 'The output file for the generated schema')
  .action(async (appUrl: string, output: string) => {
    console.log(chalk.blue(`Generating schema from ${appUrl}...`));

    try {
      const appId = parseInt(appUrl.split('/').pop() || '', 10);
      if (isNaN(appId)) {
        throw new Error('Invalid app URL. Could not parse appId.');
      }

      // Fetch the appDbId from the umsApi
      const appQuery = {
        query: {
          app: {
            get: {
              __args: {
                filters: {
                  id: appId,
                },
              },
              appDbId: true,
            },
          },
        },
      };
      const appQueryString = jsonToGraphQLQuery(appQuery, { pretty: true });
      const appResponse = await umsApi.post<{ data: AppGetResponse }>('', {
        query: appQueryString,
      });

      const appDbId = appResponse.data.data.app.get.appDbId;

      // Fetch the schema from the apyApi
      const bambooQuery = {
        query: {
          bambooModels: {
            __args: {
              filtersSet: {
                conjunction: new EnumType('and'),
                filtersSet: [
                  {
                    field: new EnumType('isInternal'),
                    operator: '=',
                    value: 0,
                  },
                ],
              },
            },
            records: {
              id: true,
              name: true,
              title: true,
              fields: {
                __args: {
                  filtersSet: {
                    conjunction: new EnumType('and'),
                    filtersSet: [
                      {
                        field: new EnumType('isInternal'),
                        operator: '=',
                        value: 0,
                      },
                    ],
                  },
                },
                id: true,
                name: true,
                title: true,
                type: true,
                options: true,
                returnType: true,
              },
            },
          },
        },
      };
      const bambooQueryString = jsonToGraphQLQuery(bambooQuery, {
        pretty: true,
      });
      const bambooResponse = await taylorApi.post<{
        data: BambooModelsResponse;
      }>('api/' + appDbId, {
        query: bambooQueryString,
      });

      const schemaData = bambooResponse.data.data;

      if (!schemaData) {
        throw new Error('No schema data found in the response');
      }

      if (schemaData.bambooModels.records.length === 0) {
        throw new Error('No tables found in the schema');
      }

      const taylorTypeGenerator = new TaylorTypeGenerator(
        schemaData,
        output,
        path.join(__dirname, '../templates/schema-default.template.hbs'),
      );

      await taylorTypeGenerator.build();

      console.log(
        chalk.green(`Schema generated successfully at ${path.resolve(output)}`),
      );
    } catch (error: any) {
      console.error(chalk.red(`Failed to generate schema: ${error.message}`));
    }
  });
