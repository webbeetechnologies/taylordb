import { PluginActionNode } from './@types/internal-types.js';
import { Executor } from './executor.js';

export type InferActionName<DB, PluginName extends string> = DB extends {
  _plugins: infer P;
}
  ? PluginName extends keyof P
    ? keyof P[PluginName] & string
    : string
  : string;

export type InferActionInput<
  DB,
  PluginName extends string,
  ActionName extends string,
> = DB extends { _plugins: infer P }
  ? PluginName extends keyof P
    ? ActionName extends keyof P[PluginName]
      ? P[PluginName][ActionName] extends { input: infer I }
        ? I extends Record<string, any>
          ? I
          : Record<string, any>
        : Record<string, any>
      : Record<string, any>
    : Record<string, any>
  : Record<string, any>;

export type InferActionResult<
  DB,
  PluginName extends string,
  ActionName extends string,
> = DB extends { _plugins: infer P }
  ? PluginName extends keyof P
    ? ActionName extends keyof P[PluginName]
      ? P[PluginName][ActionName] extends { result: infer R }
        ? R
        : any
      : any
    : any
  : any;

/**
 * A builder for executing a specific plugin action.
 * @template DB - The database type.
 * @template PluginName - The name of the plugin.
 * @template ActionName - The name of the action.
 * @template Input - The input type for the action.
 * @template Result - The expected result type.
 */
export class PluginActionBuilder<
  DB,
  PluginName extends string,
  ActionName extends string,
  Input extends Record<string, any> = InferActionInput<
    DB,
    PluginName,
    ActionName
  >,
  Result = InferActionResult<DB, PluginName, ActionName>,
> {
  #node: PluginActionNode;
  #executor: Executor;

  constructor(node: PluginActionNode, executor: Executor) {
    this.#node = node;
    this.#executor = executor;
  }

  /**
   * Sets the input variables for the plugin action.
   * @param input - An object containing the action's input arguments, including `recordId` if applicable.
   * @returns The `PluginActionBuilder` instance for chaining.
   *
   * @example
   * ```typescript
   * await qb
   *   .plugin('email')
   *   .action('send')
   *   .input({ recordId: 123, scheduledAt: '2026-03-10T10:00:00Z' })
   *   .execute();
   * ```
   */
  input(
    input: Input,
  ): PluginActionBuilder<DB, PluginName, ActionName, Input, Result> {
    return new PluginActionBuilder<DB, PluginName, ActionName, Input, Result>(
      {
        ...this.#node,
        input,
      },
      this.#executor,
    );
  }

  /**
   * Executes the plugin action.
   * @returns A promise that resolves with the result of the action.
   *
   * @example
   * ```typescript
   * const result = await qb
   *   .plugin('email')
   *   .action('send')
   *   .input({ recordId: 123 })
   *   .execute();
   * ```
   */
  async execute(): Promise<Result> {
    const response = await this.#executor.execute<Result[]>(this);
    return response[0];
  }

  compile(): { query: string; variables: Record<string, any> } {
    const query = 'mutation ($metadata: JSON) { execute(metadata: $metadata) }';

    const metadata = [this._prepareMetadata()];

    return {
      query,
      variables: {
        metadata,
      },
    };
  }

  _prepareMetadata(): any {
    return {
      type: this.#node.type,
      plugin: this.#node.plugin,
      action: this.#node.action,
      input: this.#node.input,
    };
  }
}

/**
 * A builder scoped to a specific plugin, used to select an action to execute.
 * @template DB - The database type.
 * @template PluginName - The name of the plugin.
 */
export class PluginBuilder<DB, PluginName extends string> {
  #pluginName: PluginName;
  #executor: Executor;

  constructor(pluginName: PluginName, executor: Executor) {
    this.#pluginName = pluginName;
    this.#executor = executor;
  }

  /**
   * Selects an action to execute on this plugin.
   * @param actionName - The name of the action to execute.
   * @returns A `PluginActionBuilder` instance.
   *
   * @example
   * ```typescript
   * const actionBuilder = qb.plugin('email').action('send');
   * ```
   */
  action<ActionName extends InferActionName<DB, PluginName>>(
    actionName: ActionName,
  ): PluginActionBuilder<DB, PluginName, ActionName> {
    return new PluginActionBuilder<DB, PluginName, ActionName>(
      {
        type: 'plugin-action',
        plugin: this.#pluginName,
        action: actionName,
        input: {},
      },
      this.#executor,
    );
  }
}
