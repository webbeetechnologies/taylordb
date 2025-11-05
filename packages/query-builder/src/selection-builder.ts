import type {AnyDB} from './internal-types.js';
import {QueryBuilder} from './query-builder.js';

export class SelectionBuilder<DB extends AnyDB> {
  useLink<TableName extends keyof DB & string>(
    from: TableName
  ): QueryBuilder<DB, TableName> {
    return new QueryBuilder<DB, TableName>({
      from: from,
      selects: [],
      filters: {conjunction: 'and', filters: []},
      queryType: 'link',
    });
  }
}
