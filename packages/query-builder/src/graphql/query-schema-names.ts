import {makeTypeName} from './utilities.js';

export const makeQueryResponseTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'response');

export const makeRequestParameterTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'request', 'parameter');

export const makeRequestFiltersSetTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'filtersSet');

export const makeRequestSortingTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'sorting');

export const makeRequestGroupingTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'grouping');

export const makeQueryTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'query');

/**
 *
 * Aggregations
 *
 */
export const makeAggregationResponseTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'aggregation', 'response');

export const makeAggregatsTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'aggregates');
