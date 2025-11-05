import {jsonToGraphQLQuery} from 'json-to-graphql-query';
import {InsertQueryBuilder} from './insert-query-builder.js';
import type {AnyDB, FilterGroup, QueryNode} from './internal-types.js';
import {FilterableQueryBuilder} from './where-query-builder.js';

export class QueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB
> extends FilterableQueryBuilder<DB, TableName> {
  select<
    K extends
      | keyof DB[TableName]
      | ((builder: SelectionBuilder<DB>) => QueryBuilder<DB, any>)
  >(fields: K[]): QueryBuilder<DB, TableName> {
    const newSelects = fields.map(field => {
      if (typeof field === 'function') {
        const builder = new SelectionBuilder<DB>();
        const subQuery = field(builder);
        return subQuery._node;
      }
      return field as string;
    });

    return new QueryBuilder({
      ...this._node,
      selects: [...this._node.selects, ...newSelects],
    });
  }

  limit(count: number): QueryBuilder<DB, TableName> {
    return new QueryBuilder({
      ...this._node,
      pagination: {...this._node.pagination, limit: count},
    });
  }

  offset(count: number): QueryBuilder<DB, TableName> {
    return new QueryBuilder({
      ...this._node,
      pagination: {...this._node.pagination, offset: count},
    });
  }

  paginate(page: number, limit: number): QueryBuilder<DB, TableName> {
    return this.offset((page - 1) * limit).limit(limit);
  }

  compile() {
    const buildFilters = (group: FilterGroup): any => {
      if (group.filters.length === 0) return undefined;
      return {
        conjunction: group.conjunction,
        filtersSet: group.filters.map(f => {
          if ('conjunction' in f) {
            return buildFilters(f);
          }
          return {field: f.field, operator: f.operator, value: f.value};
        }),
      };
    };

    const buildSelects = (selects: (string | QueryNode)[]): any => {
      return selects.reduce((acc, field) => {
        if (typeof field === 'string') {
          acc[field] = true;
        } else {
          const from = field.from;
          const subSelects = buildSelects(field.selects);
          const filters = buildFilters(field.filters);
          const pagination = field.pagination;

          const args = {
            ...(filters && {filtersSet: filters}),
            ...(pagination && {pagination}),
          };

          acc[from] = {
            ...(Object.keys(args).length > 0 && {__args: args}),
            ...(field.queryType === 'root'
              ? Object.keys(subSelects).length > 0 && {records: subSelects}
              : subSelects),
          };
        }
        return acc;
      }, {} as any);
    };

    const mainSelects = buildSelects(this._node.selects);
    const mainFilters = buildFilters(this._node.filters);
    const mainPagination = this._node.pagination;

    const args = {
      ...(mainFilters && {filtersSet: mainFilters}),
      ...(mainPagination && {pagination: mainPagination}),
    };

    const query = {
      query: {
        [this._node.from]: {
          ...(Object.keys(mainSelects).length > 0 && {records: mainSelects}),
          ...(Object.keys(args).length > 0 && {__args: args}),
        },
      },
    };

    return jsonToGraphQLQuery(query, {pretty: true});
  }
}

export class RootQueryBuilder<DB extends AnyDB> {
  selectFrom<TableName extends keyof DB & string>(
    from: TableName
  ): QueryBuilder<DB, TableName> {
    return new QueryBuilder<DB, TableName>({
      from: from,
      selects: [],
      filters: {conjunction: 'and', filters: []},
      queryType: 'root',
    });
  }

  insertInto<TableName extends keyof DB & string>(
    _from: TableName
  ): InsertQueryBuilder<DB, TableName> {
    return new InsertQueryBuilder<DB, TableName>();
  }
}

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

export function createQueryBuilder<DB extends AnyDB>(): RootQueryBuilder<DB> {
  return new RootQueryBuilder<DB>();
}
