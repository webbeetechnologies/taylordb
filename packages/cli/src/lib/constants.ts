import { BambooField } from './types';

export const defaultFields: BambooField[] = [
  {
    id: 1,
    name: 'id',
    type: 'number',
    options: {},
    title: 'ID',
    returnType: 'number',
  },
  {
    id: 2,
    name: 'createdAt',
    type: 'createdAt',
    options: {},
    title: 'Created At',
    returnType: 'date',
  },
  {
    id: 3,
    name: 'updatedAt',
    type: 'updatedAt',
    options: {},
    title: 'Updated At',
    returnType: 'date',
  },
  {
    id: 4,
    name: 'searchText',
    type: 'search',
    options: { isRequired: true },
    title: 'Search Text',
    returnType: 'string',
  },
];
