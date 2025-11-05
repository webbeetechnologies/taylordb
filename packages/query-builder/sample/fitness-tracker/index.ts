import {createQueryBuilder} from '../../src/index.js';
import {TaylorDatabase} from './taylorclient.types.js';

// @ts-ignore
const qb = createQueryBuilder<TaylorDatabase>();

const {query, variables} = qb
  .selectFrom('calories')
  .where('id', '=', 1)
  .select([
    'id',
    qb =>
      qb
        .useLink('goals')
        .select(['id', 'name', 'value', 'description'])
        .where('id', 'hasAnyOf', [1, 2, 3]),

    qb =>
      qb
        .useLink('cardio')
        .select(['id', 'duration', 'distance'])
        .where('id', 'hasAnyOf', [1, 2, 3]),

    'proteinPer100G',
    'carbsPer100G',
    'fatsPer100G',
    'mealName',
    'mealIngredient',
    'quantity',
    'unit',
  ])
  .orderBy('fatsPer100G', 'desc')
  .compile();

console.dir({query, variables}, {depth: null});

qb.selectFrom('calories')
  .select(['mealName'])
  .where(qb => qb.where('mealName', '=', 'Breakfast'))
  .compile();

console.dir(query);
