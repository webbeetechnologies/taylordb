import { IndentationText, Project, QuoteKind, ScriptTarget } from 'ts-morph';
import { PluginTypeGenerator } from '../type-generator/plugin-type-generator';
import { BambooPluginsResponse } from '../lib/types';

describe('PluginTypeGenerator', () => {
  it('generates stable top-level helper types for nested plugin schemas', async () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ESNext,
      },
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
      },
    });

    const sourceFile = project.createSourceFile(
      'schema.ts',
      'export type TaylorDatabase = {};',
      { overwrite: true },
    );

    const pluginData: BambooPluginsResponse = {
      bambooPlugins: {
        records: [
          {
            id: 'mailcal',
            name: 'mailcal',
            type: 'integration',
            actions: [
              {
                name: 'synchronizeEmails',
                description:
                  'Synchronizes emails based on the provided configuration',
                inputSchema: {
                  type: 'object',
                  properties: {
                    configuration: {
                      oneOf: [
                        {
                          type: 'object',
                          properties: {
                            type: {
                              const: 'all',
                            },
                          },
                          required: ['type'],
                        },
                        {
                          type: 'object',
                          properties: {
                            type: {
                              const: 'folder',
                            },
                            folderId: {
                              type: 'number',
                            },
                          },
                          required: ['type', 'folderId'],
                        },
                      ],
                    },
                  },
                  required: ['configuration'],
                },
                outputSchema: {
                  $defs: {
                    Folder: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'number',
                        },
                        label: {
                          type: 'string',
                        },
                      },
                      required: ['id', 'label'],
                    },
                  },
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                    folder: {
                      $ref: '#/$defs/Folder',
                    },
                  },
                  required: ['success', 'folder'],
                },
              },
              {
                name: 'listFolders',
                description: 'Returns list of email folders',
              },
            ],
          },
        ],
      },
    };

    const generator = new PluginTypeGenerator(sourceFile, pluginData);

    await expect(generator.generate()).resolves.toBeUndefined();
    sourceFile.addTypeAlias({
      isExported: true,
      name: 'LaterTable',
      type: '{}',
    });

    const output = sourceFile.getFullText();

    expect(output).toContain('_plugin: {');
    expect(output).toContain(
      "'synchronizeEmails': PluginActionType<PluginTypesMailcalSynchronizeEmailsInput, PluginTypesMailcalSynchronizeEmailsOutput>;",
    );
    expect(output).toContain(
      "'listFolders': PluginActionType<Record<string, any>, any>;",
    );
    expect(output).toContain(
      'export interface PluginTypesMailcalSynchronizeEmailsInput {',
    );
    expect(output).toContain('configuration:');
    expect(output).toContain('type: "all";');
    expect(output).toContain('type: "folder";');
    expect(output).toContain('folderId: number;');
    expect(output).toContain(
      'export interface PluginTypesMailcalSynchronizeEmailsOutput {',
    );
    expect(output).toContain(
      'export interface PluginTypesMailcalSynchronizeEmailsOutputFolder {',
    );
    expect(output).toContain(
      'folder: PluginTypesMailcalSynchronizeEmailsOutputFolder;',
    );
    expect(output.indexOf('export type PluginActionType<I, O>')).toBeLessThan(
      output.indexOf('export type TaylorDatabase = {'),
    );
    expect(
      output.indexOf(
        'export interface PluginTypesMailcalSynchronizeEmailsInput {',
      ),
    ).toBeLessThan(output.indexOf('export type TaylorDatabase = {'));
    expect(
      output.indexOf(
        'export interface PluginTypesMailcalSynchronizeEmailsOutput {',
      ),
    ).toBeLessThan(output.indexOf('export type LaterTable = {};'));
  });
});
