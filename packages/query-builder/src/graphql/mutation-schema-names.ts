import {makeTypeName} from './utilities.js';

export const makeMutationInputTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'mutation', 'parameters');

export const makeUpdateTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'mutation', 'values');

export const makeMutationFiltersSetName = (tableName: string) =>
  makeTypeName('table', tableName, 'mutation', 'filtersSet');

export const makeCreationResponseTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'creation', 'response');

export const makeMutationTypeName = (tableName: string) =>
  makeTypeName('table', tableName, 'mutation');
