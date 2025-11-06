import { LinkColumnType } from '@taylordb/shared';
import { FieldWithDirection, FiltersSet } from '@webbeetechnologies/dbwand-utilities/index.js';
import { EnumType, jsonToGraphQLQuery } from 'json-to-graphql-query';
import { InsertQueryBuilder } from './insert-query-builder.js';
import {
  AnyDB,
  QueryNode,
} from './internal-types.js';
import { SelectionBuilder } from './selection-builder.js';
import { FilterableQueryBuilder } from './where-query-builder.js';

type NonLinkColumnNames<T> = {
  [K in keyof T]: T[K] extends LinkColumnType<any> ? never : K;
}[keyof T];

export class QueryBuilder<
  DB extends AnyDB,
  TableName extends keyof DB
> extends FilterableQueryBuilder<DB, TableName> {
  select<
    K extends
      | NonLinkColumnNames<DB[TableName]>
      | ((builder: SelectionBuilder<DB, TableName>) => QueryBuilder<DB, any>)
  >(fields: K[]): QueryBuilder<DB, TableName> {
    const newSelects = fields.map(field => {
      if (typeof field === 'function') {
        const builder = new SelectionBuilder<DB, TableName>();
        const subQuery = field(builder);
        return subQuery._node;
      }
      return field as string;
    });

    return new QueryBuilder({
      ...this._node,
      fields: [...this._node.fields, ...newSelects],
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

  orderBy(
    field: keyof DB[TableName],
    direction: 'asc' | 'desc' = 'asc'
  ): QueryBuilder<DB, TableName> {
    const newSorting: FieldWithDirection<string> = {
      field: field as string,
      direction,
    };

    return new QueryBuilder({
      ...this._node,
      sorting: [...(this._node.sorting || []), newSorting],
    });
  }

  compile(): {query: string; variables: Record<string, any>} {
    const context = {
      variables: {} as Record<string, any>,
      varDefinitions: {} as Record<string, string>,
    };

    const queryBody = this._compile(context);

    const query = {
      query: {
        __variables: context.varDefinitions,
        ...queryBody,
      },
    };

    return {
      query: jsonToGraphQLQuery(query, {pretty: true}),
      variables: context.variables,
    };
  }

  private _compile(context: {
    variables: Record<string, any>;
    varDefinitions: Record<string, string>;
  }): any {
    const buildFilters = (group: FiltersSet<string>): any => {
      if (!group || group.filtersSet.length === 0) return undefined;
      return {
        conjunction: group.conjunction,
        filtersSet: group.filtersSet.map(f => {
          if ('conjunction' in f) {
            return buildFilters(f);
          }
          return {field: f.field, operator: f.operator, value: f.value};
        }),
      };
    };

    const buildSelects = (selects: QueryNode['fields']): any => {
      return selects.reduce((acc, field) => {
        if (typeof field === 'string') {
          acc[field] = true;
        } else {
          const subQueryBuilder = new QueryBuilder(field);
          const compiledSubQuery = subQueryBuilder._compile(context);
          acc[field.tableName] = compiledSubQuery[field.tableName];
        }
        return acc;
      }, {} as any);
    };

    const mainSelects = buildSelects(this._node.fields);
    const mainFilters = buildFilters(this._node.filtersSet);
    const mainPagination = this._node.pagination;
    const mainOrderBy = this._node.sorting;

    const args: any = {};

    if (mainFilters) {
      const filtersVarName =
        this._node.queryType === 'root'
          ? 'filtersSet'
          : `${this._node.tableName}_filtersSet`;

      args.filtersSet = new EnumType('$' + filtersVarName);
      context.varDefinitions[filtersVarName] = makeRequestFiltersSetTypeName(
        this._node.tableName
      );
      context.variables[filtersVarName] = mainFilters;
    }

    if (mainPagination) {
      args.pagination = mainPagination;
    }

    if (mainOrderBy) {
      args.sorting = mainOrderBy.map(o => ({
        field: new EnumType(o.field),
        direction: new EnumType(o.direction),
      }));
    }

    const records =
      this._node.queryType === 'root' && Object.keys(mainSelects).length > 0
        ? {records: mainSelects}
        : mainSelects;

    return {
      [this._node.tableName]: {
        ...(Object.keys(args).length > 0 && {__args: args}),
        ...records,
      },
    };
  }
}

export class RootQueryBuilder<DB extends AnyDB> {
  selectFrom<
    TableName extends keyof Omit<
      DB,
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string
  >(from: TableName): QueryBuilder<DB, TableName> {
    return new QueryBuilder<DB, TableName>({
      tableName: from,
      fields: [],
      filtersSet: {conjunction: 'and', filtersSet: []},
      type: 'select',
      queryType: 'root',
    });
  }

  insertInto<
    TableName extends keyof Omit<
      DB,
      'selectTable' | 'attachmentTable' | 'collaboratorsTable'
    > &
      string
  >(into: TableName): InsertQueryBuilder<DB, TableName> {
    return new InsertQueryBuilder<DB, TableName>({
      into: into,
      values: [],
      returning: [],
    });
  }
}

export function createQueryBuilder<DB extends AnyDB>() {
  return new RootQueryBuilder<DB>();
}
