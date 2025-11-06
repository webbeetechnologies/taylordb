import {createQueryBuilder} from '../../src/index.js';
import {TaylorDatabase} from './taylorclient.types.js';

// @ts-ignore
const qb = createQueryBuilder<TaylorDatabase>(context);

qb.batch([
  qb
    .selectFrom('calories')
    .where('id', '=', 1)
    .with('unit')
    .with({unit: qb => qb.selectFrom('selectTable').select(['color', 'name'])})
    .select([
      'id',
      qb =>
        qb
          .useLink('unit')
          .select(['color', 'name'])
          .where('id', 'hasNoneOf', [1, 2, 3]),

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
    .orderBy('fatsPer100G', 'desc'),
])
  .subscribe((query1, query2) => {})
  .execute();

const {query, variables} = qb
  .selectFrom('calories')
  .where('id', '=', 1)
  .select([
    'id',
    qb =>
      qb
        .useLink('timeOfDay')
        .select(['color'])
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

const {query: insertQuery, variables: insertVars} = qb
  .insertInto('calories')
  .values([
    {
      mealName: 'Protein Shake',
      proteinPer100G: 25,
      carbsPer100G: 5,
      fatsPer100G: 2,
      timeOfDay: [2],
    },
    {
      mealName: 'Chicken Salad',
      proteinPer100G: 30,
      carbsPer100G: 10,
      fatsPer100G: 15,
    },
  ])
  .compile();

console.log('\n--- Insert Records ---');
console.log(insertQuery);
console.log(insertVars);
