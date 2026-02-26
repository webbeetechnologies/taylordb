import * as fs from 'fs';
import * as path from 'path';
import { TaylorTypeGenerator } from '../type-generator/taylor-type-generator';
import { BambooModelsResponse } from '../lib/types';
import { taylorApi } from '../lib/api';

async function generate() {
  const schemaPath = path.join(__dirname, 'example-schema.json');
  const outputPath = path.join(__dirname, 'generated-schema.ts');
  const templatePath = path.join(
    __dirname,
    '../templates/schema-default.template.hbs',
  );

  console.log(`Loading schema from ${schemaPath}...`);
  const schemaRaw = fs.readFileSync(schemaPath, 'utf-8');
  const schemaData: BambooModelsResponse = JSON.parse(schemaRaw).data;

  // Mock taylorApi so we don't try to make real network requests to the API during test generation
  // @ts-ignore
  taylorApi.post = async (url: string, body: any) => {
    // Parse the GraphQL query back out from the body
    const queryStr = body.query as string;
    const match = queryStr.match(/{\s*([_a-zA-Z0-9]+)\s*\{/);
    if (match) {
      const tableName = match[1];
      // Find the select field options from the schemaData to map to mock values
      const mockedRecords: { id: number; name: string }[] = [];

      for (const table of schemaData.bambooModels.records) {
        for (const field of table.fields) {
          if (field.type === 'select' && field.options?.on === tableName) {
            // For example schema, we extract choices if available, or just mock standard options
            if (field.options.choices) {
              return {
                data: {
                  data: { [tableName]: { records: field.options.choices } },
                },
              };
            }

            // If we don't have explicit choices in the JSON, return some mock choices based on field name
            return {
              data: {
                data: {
                  [tableName]: {
                    records: [
                      { id: 1, name: 'Option 1' },
                      { id: 2, name: 'Option 2' },
                    ],
                  },
                },
              },
            };
          }
        }
      }
      return { data: { data: { [tableName]: { records: mockedRecords } } } };
    }
    return { data: { data: {} } };
  };

  const generator = new TaylorTypeGenerator(
    schemaData,
    outputPath,
    templatePath,
    'mock-app-db-id',
  );

  console.log('Generating types...');
  await generator.build();
  console.log(`Generated types saved to ${outputPath}`);
}

generate().catch(err => {
  console.error('Failed to generate test types:', err);
  process.exit(1);
});
