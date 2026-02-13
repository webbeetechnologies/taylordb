import * as fs from 'fs';
import * as path from 'path';
import { TaylorTypeGenerator } from '../type-generator/taylor-type-generator';
import { BambooModelsResponse } from '../lib/types';

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
