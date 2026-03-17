import { Node, SourceFile, SyntaxKind } from 'ts-morph';
import { compile } from 'json-schema-to-typescript';
import { BambooPluginsResponse } from '../lib/types';
import { camelCase, isEmpty, upperFirst } from 'lodash';

export class PluginTypeGenerator {
  private readonly usedTypePrefixes = new Set<string>();
  private readonly usedTypeNames = new Set<string>();

  constructor(
    private readonly sourceFile: SourceFile,
    private readonly pluginData: BambooPluginsResponse,
  ) {}

  async generate(): Promise<void> {
    if (
      !this.pluginData?.bambooPlugins?.records ||
      this.pluginData.bambooPlugins.records.length === 0
    ) {
      return;
    }

    let insertionIndex = this.getTaylorDatabaseStatementIndex();

    // Ensure PluginActionType exists
    if (!this.sourceFile.getTypeAlias('PluginActionType')) {
      this.sourceFile.insertTypeAlias(insertionIndex, {
        isExported: true,
        name: 'PluginActionType',
        typeParameters: ['I', 'O'],
        type: '{ input: I; result: O; }',
        docs: [
          {
            description: 'Generic type for plugin actions',
          },
        ],
      });
      insertionIndex += 1;
    }

    const pluginTypeStatements: string[] = [];
    let pluginsInterfaceString = '{\n';

    for (const plugin of this.pluginData.bambooPlugins.records) {
      if (isEmpty(plugin.actions)) continue;

      pluginsInterfaceString += `  '${plugin.name}': {\n`;

      for (const action of plugin.actions) {
        const typePrefix = this.getTypePrefix(plugin.name, action.name);

        let inputTypeStr = 'Record<string, any>';
        if (action.inputSchema) {
          try {
            const inputTypes = await this.compileSchemaDeclarations(
              action.inputSchema,
              typePrefix,
              'Input',
            );
            pluginTypeStatements.push(...inputTypes.declarations);
            inputTypeStr = inputTypes.rootTypeName;
          } catch (err) {
            console.warn(
              `Failed to compile inputSchema for plugin ${plugin.name} action ${action.name}`,
              err,
            );
          }
        }

        let outputTypeStr = 'any';
        if (action.outputSchema) {
          try {
            const outputTypes = await this.compileSchemaDeclarations(
              action.outputSchema,
              typePrefix,
              'Output',
            );
            pluginTypeStatements.push(...outputTypes.declarations);
            outputTypeStr = outputTypes.rootTypeName;
          } catch (err) {
            console.warn(
              `Failed to compile outputSchema for plugin ${plugin.name} action ${action.name}`,
              err,
            );
          }
        }

        if (action.description) {
          pluginsInterfaceString += `    /**\n     * ${action.description.replace(/\n/g, '\n     * ')}\n     */\n`;
        }
        pluginsInterfaceString += `    '${action.name}': PluginActionType<${inputTypeStr}, ${outputTypeStr}>;\n`;
      }

      pluginsInterfaceString += '  };\n';
    }
    pluginsInterfaceString += '}';

    const taylorDatabaseInterface =
      this.sourceFile.getTypeAlias('TaylorDatabase');

    if (!taylorDatabaseInterface) {
      throw new Error('TaylorDatabase type not found');
    }

    if (pluginTypeStatements.length > 0) {
      this.sourceFile.insertStatements(insertionIndex, pluginTypeStatements);
    }

    // @ts-ignore
    taylorDatabaseInterface.getTypeNodeOrThrow().addProperty({
      name: '_plugin',
      type: pluginsInterfaceString,
    });
  }

  private async compileSchemaDeclarations(
    schema: unknown,
    typePrefix: string,
    rootTypeName: string,
  ): Promise<{ declarations: string[]; rootTypeName: string }> {
    const compiledSchema = await compile(schema, rootTypeName, {
      bannerComment: '',
      additionalProperties: false,
    });

    const tempSourceFile = this.sourceFile
      .getProject()
      .createSourceFile(
        `plugin-type-generator.${typePrefix}.${rootTypeName}.ts`,
        compiledSchema,
        {
          overwrite: true,
        },
      );

    const declarations = tempSourceFile.getStatements().filter(statement => {
      const kind = statement.getKind();
      return (
        kind === SyntaxKind.InterfaceDeclaration ||
        kind === SyntaxKind.TypeAliasDeclaration
      );
    });

    const rootDeclaration =
      tempSourceFile.getInterface(rootTypeName) ||
      tempSourceFile.getTypeAlias(rootTypeName);

    if (!rootDeclaration || declarations.length === 0) {
      throw new Error(
        `Compiled schema for ${typePrefix}.${rootTypeName} did not contain a root type declaration`,
      );
    }

    const renamedDeclarations = new Map<string, string>();

    for (const declaration of declarations) {
      const interfaceDeclaration = declaration.asKind(
        SyntaxKind.InterfaceDeclaration,
      );
      const typeAliasDeclaration = declaration.asKind(
        SyntaxKind.TypeAliasDeclaration,
      );
      const declarationName =
        interfaceDeclaration?.getName() || typeAliasDeclaration?.getName();

      if (!declarationName) continue;

      const renamedDeclaration = this.getGeneratedTypeName(
        typePrefix,
        rootTypeName,
        declarationName,
      );
      renamedDeclarations.set(declarationName, renamedDeclaration);

      interfaceDeclaration?.rename(renamedDeclaration);
      typeAliasDeclaration?.rename(renamedDeclaration);
    }

    return {
      declarations: declarations.map(statement => statement.getText()),
      rootTypeName:
        renamedDeclarations.get(rootTypeName) || `${typePrefix}${rootTypeName}`,
    };
  }

  private getTypePrefix(pluginName: string, actionName: string) {
    const baseName = `PluginTypes${upperFirst(camelCase(pluginName))}${upperFirst(
      camelCase(actionName),
    )}`;

    if (!this.usedTypePrefixes.has(baseName)) {
      this.usedTypePrefixes.add(baseName);
      return baseName;
    }

    let suffix = 2;
    let candidate = `${baseName}${suffix}`;
    while (this.usedTypePrefixes.has(candidate)) {
      suffix += 1;
      candidate = `${baseName}${suffix}`;
    }

    this.usedTypePrefixes.add(candidate);
    return candidate;
  }

  private getGeneratedTypeName(
    typePrefix: string,
    rootTypeName: string,
    declarationName: string,
  ) {
    const baseName =
      declarationName === rootTypeName
        ? `${typePrefix}${rootTypeName}`
        : `${typePrefix}${rootTypeName}${upperFirst(
            camelCase(declarationName),
          )}`;

    if (!this.usedTypeNames.has(baseName)) {
      this.usedTypeNames.add(baseName);
      return baseName;
    }

    let suffix = 2;
    let candidate = `${baseName}${suffix}`;
    while (this.usedTypeNames.has(candidate)) {
      suffix += 1;
      candidate = `${baseName}${suffix}`;
    }

    this.usedTypeNames.add(candidate);
    return candidate;
  }

  private getTaylorDatabaseStatementIndex() {
    const statementIndex = this.sourceFile
      .getStatements()
      .findIndex(
        statement =>
          Node.isTypeAliasDeclaration(statement) &&
          statement.getName() === 'TaylorDatabase',
      );

    if (statementIndex === -1) {
      throw new Error('TaylorDatabase type not found');
    }

    return statementIndex;
  }
}
