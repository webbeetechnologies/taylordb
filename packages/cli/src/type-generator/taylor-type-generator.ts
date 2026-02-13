import * as fs from 'fs';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { camelCase, flatten, uniq, uniqBy, upperFirst } from 'lodash';
import {
  IndentationText,
  Project,
  QuoteKind,
  SourceFile,
  VariableDeclarationKind,
} from 'ts-morph';
import { taylorApi } from '../lib/api';
import { defaultFields } from '../lib/constants';
import { BambooModelsResponse } from '../lib/types';
import { TypeMapper } from './type-mapper';

export class TaylorTypeGenerator {
  private readonly sourceFile: SourceFile;
  private typeMapper: TypeMapper;

  constructor(
    private readonly schema: BambooModelsResponse,
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

    this.schema.bambooModels.records.forEach(table => {
      table.fields
        .filter(field => field.type === 'select')
        .forEach(field => {
          const options = optionsMap.get(field.options.on);
          if (options) {
            this.sourceFile.addVariableStatement({
              isExported: true,
              declarationKind: VariableDeclarationKind.Const,
              declarations: [
                {
                  name: this.getSingleSelectConstName(table.name, field.name),
                  initializer: `[${options
                    .map(o => `'${o.name.replace(/'/g, "\\'")}'`)
                    .join(', ')}] as const`,
                },
              ],
            });
          }
        });

      const properties = uniqBy(
        [...defaultFields, ...table.fields],
        field => field.name,
      )
        .map(column => ({
          name: column.name,
          type: this.typeMapper.map(column),
        }))
        .filter(p => p.type)
        .map(p => `${p.name}: ${p.type};`)
        .join('\n');

      this.sourceFile.addTypeAlias({
        name: this.getTableName(table.name),
        type: `{\n${properties}\n}`,
      });
    });

    const taylorDatabaseInterface =
      this.sourceFile.getTypeAlias('TaylorDatabase');

    if (!taylorDatabaseInterface)
      throw new Error('TaylorDatabase type not found');

    for (const table of this.schema.bambooModels.records) {
      // @ts-ignore
      taylorDatabaseInterface.getTypeNodeOrThrow().addProperty({
        name: table.name,
        type: this.getTableName(table.name),
      });
    }

    await this.sourceFile.save();
  }

  getTableName(name: string) {
    return upperFirst(camelCase(name + ' table'));
  }

  getSingleSelectConstName(tableName: string, fieldName: string) {
    return `${upperFirst(camelCase(tableName))}${upperFirst(
      camelCase(fieldName),
    )}Options`;
  }

  private async _fetchSingleSelectOptions() {
    const singleSelectFields = flatten(
      this.schema.bambooModels.records.map(table =>
        table.fields.filter(field => field.type === 'select'),
      ),
    );

    const optionsMap = new Map<string, { id: number; name: string }[]>();

    // First, check if fields already have choices in their options
    singleSelectFields.forEach(field => {
      if (field.options?.choices) {
        optionsMap.set(field.options.on, field.options.choices);
      }
    });

    const optionTableNames = uniq(
      singleSelectFields
        .map(field => field.options.on)
        .filter(tableName => tableName && !optionsMap.has(tableName)),
    );

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
