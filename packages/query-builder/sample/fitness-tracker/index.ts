import { createQueryBuilder } from '../../src/index.js';
import { TaylorDatabase } from './taylorclient.types.js';

// @ts-ignore
const qb = createQueryBuilder<TaylorDatabase>({
  baseUrl: 'http://localhost:8090/api/1f7c7b43-75ab-46eb-8602-d1b514896f8e',
  apiKey: 'gx0o3daoeqwb6z60ge0yw1c7bhhow49n33k5jfwxr7ucpvrpa5kfmo2t7wkeb66d',
});

//   // qb
//   //   .selectFrom('calories')
//   //   .where('id', '=', 1)
//   //   // .with({
//   //   //   unit: qb =>
//   //   //     qb.select(['color', 'name']).where('id', 'hasNoneOf', [1, 2, 3]),
//   //   // })
//   //   .select([
//   //     'id',
//   //     qb =>
//   //       qb
//   //         .useLink('unit')
//   //         .select(['color', 'name'])
//   //         .where('id', 'hasNoneOf', [1, 2, 3]),

//   //     qb =>
//   //       qb
//   //         .useLink('unit')
//   //         .select(['color', 'name'])
//   //         .where('id', 'hasAnyOf', [1, 2, 3]),

//   //     'proteinPer100G',
//   //     'carbsPer100G',
//   //     'fatsPer100G',
//   //     'mealName',
//   //     'mealIngredient',
//   //     'quantity',
//   //   ])
//   //   .where(qb =>
//   //     qb.where('carbsPer100G', '!=', 2).orWhere('carbsPer100G', '=', 3)
//   //   )
//   //   .where('carbsPer100G', '!=', 2)
//   //   .orderBy('fatsPer100G', 'desc').compile();

// const response = await qb
//   .selectFrom('calories')
//   .where('id', '=', 1)
//   .select([
//     'id',

//     qb =>
//       qb
//         .useLink('unit')
//         .select(['color', 'name'])
//         .where('id', 'hasAnyOf', [1, 2, 3]),

//   ])
//   .with({timeOfDay: qb => qb.select(['color']).where('id', 'hasAnyOf', [1, 2, 3])})
//   .where(qb =>
//     qb.where('carbsPer100G', '!=', 2).orWhere('carbsPer100G', '=', 3)
//   )
//   .where('carbsPer100G', '!=', 2)
//   .orderBy('fatsPer100G', 'desc')
//   .execute();



// //   const t = qb.selectFrom('cardio').select([
// //     'id',
// //     qb =>
// //       qb.useLink('test').select([qb => qb.useLink('test').select(['id'])]),
// //   ]).compile();

// // console.dir({query, variables, t}, {depth: null});

// // const {query: insertQuery, variables: insertVars} = qb
// //   .insertInto('calories')
// //   .values([
// //     {
// //       mealName: 'Protein Shake',
// //       proteinPer100G: 25,
// //       carbsPer100G: 5,
// //       fatsPer100G: 2,
// //       timeOfDay: [2],
// //     },
// //     {
// //       mealName: 'Chicken Salad',
// //       proteinPer100G: 30,
// //       carbsPer100G: 10,
// //       fatsPer100G: 15,
// //     },
// //   ])
// //   .returning(['carbsPer100G'])
// //   .compile();

// //   console.log('\n--- Insert Records ---');
// // console.log(insertQuery);
// // console.dir(insertVars, {depth: null});

//   const {query: updateQuery, variables: updateVars} = qb
//     .update('calories')
//     .set({
//       carbsPer100G: 10,
//       timeOfDay: [1]
//     })
//     .where(qb => qb.where('id', '=', 1).orWhere('id', '=', 2))
//     .compile();

//   console.log('\n--- Update Records ---');
//   console.log(updateQuery);
//   console.dir(updateVars, {depth: null});

(async () => {

  const response = await qb.batch([
    qb.selectFrom('customers')
    .select(['id', 'firstName', 'lastName']).where(qb => qb.where('firstName', 'contains', "mar").orWhere('lastName', 'contains', "mar")).paginate(1, 2),
    qb.insertInto('customers').values({ 
      firstName: 'John',
      lastName: 'Doe',
    }),
    qb.update('customers').set({  
      lastName: 'Doe Jr.',
    }).where(qb => qb.where('firstName', '=', 'John')),
  ]).execute()

  const response3 = await qb.selectFrom('customers')
    .select(['id', 'firstName', 'lastName'])
    .where('createdAt', '=','today')
    .execute()
    // .where(qb => qb.where('firstName', 'contains', "mar").orWhere('lastName', 'contains', "mar")).paginate(1, 2).execute()


  const response2 = await qb.update('customers').set({  
      lastName: 'Doe Jr.',
    }).where(qb => qb.where('firstName', '=', 'John')).execute();

    const response4 = await qb.deleteFrom('customers').where(qb => qb.where('firstName', '=', 'John')).execute();

    const response5 = await qb.aggregateFrom('customers').groupBy(['firstName']).withAggregates({
      lastName: ['count'],
    }).execute();


 console.dir({response4, response2, response3}, {depth: null});

})()
 