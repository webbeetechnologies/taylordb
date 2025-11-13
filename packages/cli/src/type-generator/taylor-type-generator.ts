import * as fs from 'fs';
import { camelCase, upperFirst } from 'lodash';
import { IndentationText, Project, QuoteKind, SourceFile } from 'ts-morph';
import { defaultFields } from '../lib/constants';
import { BambooModelsResponse } from '../lib/types';
import { TypeMapper } from './type-mapper';

export class TaylorTypeGenerator {
  private readonly sourceFile: SourceFile;
  private readonly typeMapper: TypeMapper;

  constructor(
    private readonly schema: BambooModelsResponse,
    private readonly output: string,
    private readonly templateFile: string,
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
      const properties = [...defaultFields, ...table.fields]
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

  get tablesSchema() {
    return this.schema.bambooModels.records;
  }
}
