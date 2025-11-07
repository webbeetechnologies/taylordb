import { createQueryBuilder } from '../../src/index.js';
import { TaylorDatabase } from './taylorclient.types.js';

// @ts-ignore
const qb = createQueryBuilder<TaylorDatabase>();

  // qb
  //   .selectFrom('calories')
  //   .where('id', '=', 1)
  //   // .with({
  //   //   unit: qb =>
  //   //     qb.select(['color', 'name']).where('id', 'hasNoneOf', [1, 2, 3]),
  //   // })
  //   .select([
  //     'id',
  //     qb =>
  //       qb
  //         .useLink('unit')
  //         .select(['color', 'name'])
  //         .where('id', 'hasNoneOf', [1, 2, 3]),

  //     qb =>
  //       qb
  //         .useLink('unit')
  //         .select(['color', 'name'])
  //         .where('id', 'hasAnyOf', [1, 2, 3]),

  //     'proteinPer100G',
  //     'carbsPer100G',
  //     'fatsPer100G',
  //     'mealName',
  //     'mealIngredient',
  //     'quantity',
  //   ])
  //   .where(qb =>
  //     qb.where('carbsPer100G', '!=', 2).orWhere('carbsPer100G', '=', 3)
  //   )
  //   .where('carbsPer100G', '!=', 2)
  //   .orderBy('fatsPer100G', 'desc').compile();

// const {query, variables} = qb
//   .selectFrom('calories')
//   .where('id', '=', 1)
//   .select([
//     'id',

//     qb =>
//       qb
//         .useLink('unit')
//         .select(['color', 'name'])
//         .where('id', 'hasAnyOf', [1, 2, 3]),

//     'proteinPer100G',
//     'carbsPer100G',
//     'fatsPer100G',
//     'mealName',
//     'mealIngredient',
//     'quantity',
//   ])
//   .with({timeOfDay: qb => qb.select(['color']).where('id', 'hasAnyOf', [1, 2, 3])})
//   .where(qb =>
//     qb.where('carbsPer100G', '!=', 2).orWhere('carbsPer100G', '=', 3)
//   )
//   .where('carbsPer100G', '!=', 2)
//   .orderBy('fatsPer100G', 'desc')
//   .compile();

//   const t = qb.selectFrom('cardio').select([
//     'id',
//     qb =>
//       qb.useLink('test').select([qb => qb.useLink('test').select(['id'])]),
//   ]).compile();

// console.dir({query, variables, t}, {depth: null});

// const {query: insertQuery, variables: insertVars} = qb
//   .insertInto('calories')
//   .values([
//     {
//       mealName: 'Protein Shake',
//       proteinPer100G: 25,
//       carbsPer100G: 5,
//       fatsPer100G: 2,
//       timeOfDay: [2],
//     },
//     {
//       mealName: 'Chicken Salad',
//       proteinPer100G: 30,
//       carbsPer100G: 10,
//       fatsPer100G: 15,
//     },
//   ])
//   .returning(['carbsPer100G'])
//   .compile();

//   console.log('\n--- Insert Records ---');
// console.log(insertQuery);
// console.dir(insertVars, {depth: null});

  const {query: updateQuery, variables: updateVars} = qb
    .update('calories')
    .set({
      carbsPer100G: 10,
      timeOfDay: [1]
    })
    .where(qb => qb.where('id', '=', 1).orWhere('id', '=', 2))
    .compile();

  console.log('\n--- Update Records ---');
  console.log(updateQuery);
  console.dir(updateVars, {depth: null});


  const {query: batchQuery, variables: batchVars} = qb
    .batch([
      qb.insertInto('calories').values({
        mealName: 'Protein Shake',
        proteinPer100G: 25,
        carbsPer100G: 5,
        fatsPer100G: 2,
        timeOfDay: [1],
      }),
      qb.update('calories').set({
        carbsPer100G: 10,
        timeOfDay: [1]
      }).where(qb => qb.where('id', '=', 1).orWhere('id', '=', 2)),
      qb.selectFrom('calories').select(['id', 'carbsPer100G']).where('id', '=', 1),
      qb.deleteFrom('calories').where(qb => qb.where('id', '=', 1).orWhere('id', '=', 2)),
    ])
    .compile();

  console.log('\n--- Batch Records ---');
  console.log(batchQuery);
  console.dir(batchVars, {depth: null});
