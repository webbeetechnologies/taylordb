import { SourceFile } from 'ts-morph';
import { compile } from 'json-schema-to-typescript';
import { BambooPluginsResponse } from '../lib/types';
import { isEmpty } from 'lodash';

export class PluginTypeGenerator {
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

    // Ensure PluginActionType exists
    if (!this.sourceFile.getTypeAlias('PluginActionType')) {
      this.sourceFile.addTypeAlias({
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
    }

    let pluginsInterfaceString = '{\n';

    for (const plugin of this.pluginData.bambooPlugins.records) {
      if (isEmpty(plugin.actions)) continue;

      pluginsInterfaceString += `  '${plugin.name}': {\n`;

      for (const action of plugin.actions) {
        let inputTypeStr = 'Record<string, any>';
        if (action.inputSchema) {
          try {
            const compiledInput = await compile(action.inputSchema, 'Input', {
              bannerComment: '',
              additionalProperties: false,
            });
            const match = compiledInput.match(
              /export interface \w+ (\{[\s\S]*?\})/,
            );
            if (match && match[1]) {
              inputTypeStr = match[1].trim();
            }
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
            const compiledOutput = await compile(
              action.outputSchema,
              'Output',
              {
                bannerComment: '',
                additionalProperties: false,
              },
            );
            const match = compiledOutput.match(
              /export interface \w+ (\{[\s\S]*?\})/,
            );
            if (match && match[1]) {
              outputTypeStr = match[1].trim();
            } else {
              // Might just be a primitive
              const primitiveMatch = compiledOutput.match(
                /export type \w+ = (.*?);/,
              );
              if (primitiveMatch && primitiveMatch[1]) {
                outputTypeStr = primitiveMatch[1].trim();
              }
            }
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

    // @ts-ignore
    taylorDatabaseInterface.getTypeNodeOrThrow().addProperty({
      name: '_plugin',
      type: pluginsInterfaceString,
    });
  }
}
