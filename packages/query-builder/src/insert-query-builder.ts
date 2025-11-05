import type {AnyDB} from './internal-types.js';

export class InsertQueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB
> {
  values(_data: Partial<DB[TableName]>) {
    console.log('Insert functionality not yet implemented.');
    return {
      compile: () => 'mutation { ... }',
    };
  }
}
