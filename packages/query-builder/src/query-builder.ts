import {EnumType, jsonToGraphQLQuery} from 'json-to-graphql-query';
import {makeRequestFiltersSetTypeName} from './graphql/query-schema-names.js';
import {InsertQueryBuilder} from './insert-query-builder.js';
import type {AnyDB, FilterGroup, QueryNode} from './internal-types.js';
import {SelectionBuilder} from './selection-builder.js';
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

  compile(): {query: string; variables: Record<string, any>} {
    const context = {
      variables: {} as Record<string, any>,
      varDefinitions: {} as Record<string, string>,
    };

    const query = this._compile(context);

    return {
      query: jsonToGraphQLQuery({query}, {pretty: true}),
      variables: context.variables,
    };
  }

  _compile(context: {
    variables: Record<string, any>;
    varDefinitions: Record<string, string>;
  }): any {
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
          const subQueryNode = field;
          const subQueryBuilder = new QueryBuilder(subQueryNode);
          const compiledSubQuery = subQueryBuilder._compile(context);

          acc[from] = compiledSubQuery[from];
        }
        return acc;
      }, {} as any);
    };

    const mainSelects = buildSelects(this._node.selects);
    const mainFilters = buildFilters(this._node.filters);
    const mainPagination = this._node.pagination;

    const args: any = {};

    if (mainFilters) {
      const filtersVarName =
        Object.keys(context.varDefinitions).length === 0
          ? 'filtersSet'
          : `${this._node.from}_filtersSet`;

      args.filtersSet = new EnumType(filtersVarName);
      context.varDefinitions[filtersVarName] = makeRequestFiltersSetTypeName(
        this._node.from
      );
      context.variables[filtersVarName] = mainFilters;
    }

    if (mainPagination) {
      args.pagination = mainPagination;
    }

    return {
      __variables: context.varDefinitions,
      [this._node.from]: {
        __args: args,
        ...(this._node.queryType === 'root'
          ? Object.keys(mainSelects).length > 0 && {records: mainSelects}
          : mainSelects),
      },
    };
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
