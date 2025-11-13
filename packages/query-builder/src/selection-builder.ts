import type { LinkColumnType } from '@taylordb/shared';
import type { AnyDB } from './@types/internal-types.js';
import { LinkColumnNames } from './@types/query-builder.js';
import { Executor } from './executor.js';
import { QueryBuilder } from './query-builder.js';

export class SelectionBuilder<
  DB extends AnyDB,
  CurrentTableName extends keyof DB,
> {
  _executor: Executor;

  constructor(executor: Executor) {
    this._executor = executor;
  }

  useLink<LinkName extends LinkColumnNames<DB[CurrentTableName]> & string>(
    from: LinkName,
  ) {
    return new QueryBuilder<
      DB,
      DB[CurrentTableName][LinkName] extends LinkColumnType<any>
        ? DB[CurrentTableName][LinkName]['linkedTo']
        : never,
      object,
      LinkName
    >(
      {
        field: from,
        fields: [],
        filtersSet: { conjunction: 'and', filtersSet: [] },
        queryType: 'link',
      },
      this._executor,
    );
  }
}
