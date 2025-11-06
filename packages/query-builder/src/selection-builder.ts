import type { LinkColumnType } from '@taylordb/shared';
import type { AnyDB } from './internal-types.js';
import { QueryBuilder } from './query-builder.js';

type LinkColumnNames<T> = {
  [K in keyof T]: T[K] extends LinkColumnType<any> ? K : never;
}[keyof T];

export class SelectionBuilder<
  DB extends AnyDB,
  CurrentTableName extends keyof DB
> {
  useLink<LinkName extends LinkColumnNames<DB[CurrentTableName]> & string>(
    from: LinkName
  ) {
    return new QueryBuilder<
      DB,
      DB[CurrentTableName][LinkName] extends LinkColumnType<any>
        ? DB[CurrentTableName][LinkName]['linkedTo']
        : never
    >({
      tableName: from,
      fields: [],
      filtersSet: {conjunction: 'and', filtersSet: []},
      queryType: 'link',
      type: 'select',
    });
  }
}
