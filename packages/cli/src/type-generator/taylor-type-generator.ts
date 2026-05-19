import * as fs from 'fs';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { flatten, uniq, uniqBy } from 'lodash';
import {
  IndentationText,
  ObjectLiteralExpression,
  Project,
  QuoteKind,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';
import { taylorApi } from '../lib/api';
import { defaultFields } from '../lib/constants';
import { BambooModelsResponse, BambooPluginsResponse } from '../lib/types';
import { GeneratedFileFormatter } from './generated-file-formatter';
import { TypeMapper } from './type-mapper';
import { PluginTypeGenerator } from './plugin-type-generator';

export class TaylorTypeGenerator {
  private readonly sourceFile: SourceFile;
  private typeMapper!: TypeMapper;

  constructor(
    private readonly schema: BambooModelsResponse & BambooPluginsResponse,
    private readonly output: string,
    private readonly templateFile: string,
    private readonly appDbId: string,
  ) {
    const project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
      },
    });

    if (this.templateFile) {
      const templateContent = fs.readFileSync(this.templateFile, 'utf-8');

      this.sourceFile = project.createSourceFile(this.output, templateContent, {
        overwrite: true,
      });
    } else {
      this.sourceFile = project.createSourceFile(this.output, '', {
        overwrite: true,
      });
    }
  }

  async build() {
    const optionsMap = await this._fetchSingleSelectOptions();
    this.typeMapper = new TypeMapper(this, optionsMap);

    const pluginGenerator = new PluginTypeGenerator(
      this.sourceFile,
      this.schema,
    );
    await pluginGenerator.generate();

    const taylorSchemaObject = this.getTaylorSchemaObjectLiteral();

    this.schema.bambooModels.records.forEach(table => {
      const properties = uniqBy(
        [...defaultFields, ...table.fields],
        field => field.name,
      )
        .map(column => ({
          name: column.name,
          type: this.typeMapper.map(column),
        }))
        .filter(p => p.type)
        .map(p => `${JSON.stringify(p.name)}: ${p.type}`)
        .join(',\n');

      taylorSchemaObject.addPropertyAssignment({
        name: JSON.stringify(table.name),
        initializer: `{\n${properties}\n}`,
      });
    });

    const formattedOutput = await new GeneratedFileFormatter(
      this.output,
    ).format(this.sourceFile.getFullText());
    this.sourceFile.replaceWithText(formattedOutput);
    await this.sourceFile.save();
  }

  private getTaylorSchemaObjectLiteral(): ObjectLiteralExpression {
    const declaration = this.sourceFile.getVariableDeclaration('taylorSchema');
    const initializer = declaration?.getInitializer();
    const callExpression = initializer?.asKind(SyntaxKind.CallExpression);
    const schemaArgument = callExpression
      ?.getArguments()[0]
      ?.asKind(SyntaxKind.ObjectLiteralExpression);

    if (!schemaArgument) {
      throw new Error('taylorSchema object not found');
    }

    return schemaArgument;
  }

  private async _fetchSingleSelectOptions() {
    const selectFields = flatten(
      this.schema.bambooModels.records.map(table =>
        table.fields.filter(field => field.type === 'select'),
      ),
    );

    const optionsMap = new Map<string, { id: number; name: string }[]>();

    // First, check if fields already have choices in their options
    selectFields.forEach(field => {
      if (field.options?.choices) {
        optionsMap.set(field.options.on, field.options.choices);
      }
    });

    const optionTableNames = uniq(selectFields.map(field => field.options.on));

    for (const tableName of optionTableNames) {
      const query = {
        query: {
          [tableName]: {
            records: { id: true, name: true },
          },
        },
      };
      const queryString = jsonToGraphQLQuery(query, { pretty: true });
      const response = await taylorApi.post<any>('api/' + this.appDbId, {
        query: queryString,
      });
      const records = response.data.data[tableName].records;
      optionsMap.set(tableName, records);
    }
    return optionsMap;
  }

  get tablesSchema() {
    return this.schema.bambooModels.records;
  }
}
