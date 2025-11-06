import {createQueryBuilder} from '../../src/index.js';
import {TaylorDatabase} from './taylorclient.types.js';

// @ts-ignore
const qb = createQueryBuilder<TaylorDatabase>();

// qb.selectFrom('cardio')
//   .select([
//     'distance',
//     qb =>
//       qb
//         .useLink('exercise')
//         .select(['id', 'name'])
//         .where('name', 'contains', 'smth')
//         .paginate(1, 10),
//   ])
//   .where(qb => qb.where('distance', '!=', 2).orWhere('distance', '=', 3))
//   .where('distance', '!=', 2)
//   .compile();

const {query, variables} = qb
  .selectFrom('calories')
  .where('id', '=', 1)
  .select([
    'id',
    qb =>
      qb
        .useLink('timeOfDay')
        .select(['color', 'name'])
        .where('id', 'hasAnyOf', [1, 2, 3]),

    qb =>
      qb
        .useLink('unit')
        .select(['color', 'name'])
        .where('id', 'hasAnyOf', [1, 2, 3]),

    'proteinPer100G',
    'carbsPer100G',
    'fatsPer100G',
    'mealName',
    'mealIngredient',
    'quantity',
  ])
  .where(qb =>
    qb.where('carbsPer100G', '!=', 2).orWhere('carbsPer100G', '=', 3)
  )
  .where('carbsPer100G', '!=', 2)
  .orderBy('fatsPer100G', 'desc')
  .compile();

console.dir({query, variables}, {depth: null});
