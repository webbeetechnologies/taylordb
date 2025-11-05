import * as fs from 'fs';
import {camelCase, upperFirst} from 'lodash';
import {IndentationText, Project, QuoteKind, SourceFile} from 'ts-morph';
import {BambooModelsResponse} from '../lib/types';
import {TypeMapper} from './type-mapper';

export class TaylorTypeGenerator {
  private readonly sourceFile: SourceFile;
  private readonly typeMapper: TypeMapper;

  constructor(
    private readonly schema: BambooModelsResponse,
    private readonly output: string,
    private readonly templateFile: string
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

    this.typeMapper = new TypeMapper(this);
  }

  async build() {
    this.schema.bambooModels.records.forEach(table => {
      this.sourceFile.addInterface({
        name: this.getTableName(table.name),
        // @ts-ignore
        properties: table.fields
          .filter(column => this.typeMapper.map(column))
          .map(column => ({
            name: column.name,
            type: this.typeMapper.map(column),
          })),
      });
    });

    this.sourceFile.addInterface({
      name: 'TaylorDatabase',
      isExported: true,
      properties: this.schema.bambooModels.records.map(table => ({
        name: table.name,
        type: this.getTableName(table.name),
      })),
    });

    await this.sourceFile.save();
  }

  getTableName(name: string) {
    return upperFirst(camelCase(name + ' table'));
  }

  get tablesSchema() {
    return this.schema.bambooModels.records;
  }
}
