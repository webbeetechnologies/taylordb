// @ts-nocheck

const queryBuilder = createQueryBuilder<TaylorDatabase>();

/**
 *
 * select with pagination
 *
 * Result Graphql:
 * {
 *  query {
 *    customers(
 *      filtersSet: {
 *        conjunction: and,
 *        filtersSet: [
 *          {
 *            field: email,
 *            operator: equals,
 *            value: "test@example.com"
 *          }
 *        ]
 *      }
 *      pagination: {
 *        page: 1
 *        limit: 10
 *      }
 *    }
 *  }
 * }
 *
 */

queryBuilder
  .selectFrom('customers')
  .select(['id', 'name', 'email', 'phone'])
  .where('email', '=', 'test@example.com')
  .paginate(1, 10);

/**
 *
 * Normal select with notmal conditions
 *
 * Result Graphql:
 * {
 *  query {
 *    customers(
 *      filtersSet: {
 *        conjunction: and,
 *        filtersSet: [
 *          {
 *            field: email,
 *            operator: equals,
 *            value: "test@example.com"
 *          }
 *        ]
 *       }
 *    ) {
 *      records {
 *        id
 *        name
 *        email
 *        phone
 *      }
 *    }
 *  }
 * }
 */
queryBuilder
  .selectFrom('customers')
  .select(['id', 'name', 'email', 'phone'])
  .where('email', '=', 'test@example.com');

/**
 * select with multiple conditions
 *
 * Result Graphql:
 * {
 *  query {
 *    customers(
 *      filtersSet: {
 *        conjunction: and,
 *        filtersSet: [
 *          {
 *            field: email,
 *            operator: equals,
 *            value: "test@example.com"
 *          },
 *          {
 *            field: phone,
 *            operator: equals,
 *            value: "1234567890"
 *          }
 *        ]
 *      }
 *    ) {
 *      records {
 *        id
 *        name
 *        email
 *        phone
 *      }
 *    }
 *  }
 * }
 */
queryBuilder
  .selectFrom('customers')
  .select(['id', 'name', 'email', 'phone'])
  .where('email', '=', 'test@example.com')
  .where('phone', '=', '1234567890');

/**
 *
 * select with multiple conditions and OR
 *
 * Result Graphql:
 * {
 *  query {
 *    customers(
 *      filtersSet: {
 *        conjunction: or,
 *        filtersSet: [
 *          {
 *            field: email,
 *            operator: equals,
 *            value: "test@example.com"
 *          },
 *          {
 *            field: phone,
 *            operator: equals,
 *            value: "1234567890"
 *          }
 *        ]
 *      }
 *    ) {
 *      records {
 *        id
 *        name
 *        email
 *        phone
 *      }
 *    }
 */
queryBuilder
  .selectFrom('customers')
  .select(['id', 'name', 'email', 'phone'])
  .where('email', '=', 'test@example.com')
  .where('phone', '=', '1234567890')
  .orWhere('name', '=', 'John Doe');

/**
 * select with nested conditions
 *
 * Result Graphql:
 * {
 *  query {
 *    customers(
 *      filtersSet: {
 *        conjunction: or,
 *        filtersSet: [
 *           {
 *            conjunction: and,
 *            filtersSet: [
 *              {
 *                field: email,
 *                operator: equals,
 *                value: "test@example.com"
 *              },
 *              {
 *                field: phone,
 *                operator: equals,
 *                value: "1234567890"
 *              },
 *              {
 *                field: name,
 *                operator: equals,
 *                value: "John Doe"
 *            ]
 *          },
 *          {
 *            conjunction: and,
 *            filtersSet: [
 *              {
 *                field: email,
 *                operator: equals,
 *                value: "test@example.com"
 *              },
 *              {
 *                field: phone,
 *                operator: equals,
 *                value: "1234567890"
 *              },
 *              {
 *                field: name,
 *                operator: equals,
 *                value: "John Doe"
 *              }
 *            ]
 *          }
 *        ]
 *      }
 *    ) {
 *      records {
 *        id
 *        name
 *        email
 *        phone
 *      }
 *    }
 *  }
 * }
 */
queryBuilder
  .selectFrom('customers')
  .select(['id', 'name', 'email', 'phone'])
  .where(() => {
    return queryBuilder
      .where('email', '=', 'test@example.com')
      .where('phone', '=', '1234567890');
  })
  .orWhere(() => {
    return queryBuilder
      .where('email', '=', 'test@example.com')
      .where('phone', '=', '1234567890');
  });

/**
 * select with link field, which gets only primary key from link table and the result will be following
 *
 * {
 *  id: number;
 *  name: string;
 *  email: string;
 *  phone: string;
 *  orders: {id: number}[];
 * }
 */
queryBuilder
  .selectFrom('customers')
  .select(['id', 'name', 'email', 'phone', 'orders']);

/**
 * Select with link field multiple values
 *
 * {
 *  id: number;
 *  name: string;
 *  email: string;
 *  phone: string;
 *  orders: {id: number, address: string}[];
 * }
 *
 * Result Graphql:
 * {
 *  query {
 *    customers(
 *      filtersSet: {
 *        conjunction: and,
 *        filtersSet: [
 *          {
 *            field: orders,
 *            operator: hasAllOf,
 *            value: [1, 2, 3]
 *          }
 *        ]
 *      }
 *    ) {
 *      records {
 *        id
 *        name
 *        email
 *        phone
 *        orders {
 *          id
 *          address
 *        }
 *      }
 *    }
 *  }
 * }
 */
queryBuilder
  .selectFrom('customers')
  .select([
    'id',
    'name',
    'email',
    'phone',
    queryBuilder => queryBuilder.useLink('orders').select(['id', 'address']),
  ])
  .where('orders', 'hasAllOf', [1, 2, 3]);

/**
 *
 * Select with link field multiple values and nested conditions   *
 * {
 *  id: number;
 *  name: string;
 *  email: string;
 *  phone: string;
 *  orders: {id: number, address: string}[];
 * }
 *
 * Result Graphql:
 * {
 *  query {
 *    customers(
 *      filtersSet: {
 *        conjunction: and,
 *        filtersSet: [
 *          {
 *            field: orders,
 *            operator: hasAllOf,
 *            value: [1, 2, 3]
 *          }
 *        ]
 *      }
 *    ) {
 *      records {
 *        id
 *        name
 *        email
 *        phone
 *        orders(
 *          filtersSet: {
 *            conjunction: and,
 *            filtersSet: [
 *              {
 *                field: address,
 *                operator: equals,
 *                value: "123 Main St"
 *              }
 *            ]
 *          }
 *        ) {
 *          id
 *          address
 *        }
 *      }
 *    }
 *  }
 * }
 *
 */
queryBuilder.selectFrom('customers').select([
  'id',
  'name',
  'email',
  'phone',
  queryBuilder =>
    queryBuilder
      .selectFrom('orders')
      .select(['id', 'address'])
      .where(() => {
        return queryBuilder.where('address', '=', '123 Main St');
      }),
]);

/**
 * Select with link field multiple values and nested conditions and pagination
 * {
 *  id: number;
 *  name: string;
 *  email: string;
 *  phone: string;
 *  orders: {id: number, address: string}[];
 * }
 *
 *  Graphql results:
 *
 * {
 *  query {
 *    customers(
 *      filtersSet: {
 *        conjunction: and,
 *        filtersSet: [
 *          {
 *            field: orders,
 *            operator: hasAllOf,
 *            value: [1, 2, 3]
 *          }
 *        ]
 *      }
 *    ) {
 *      records {
 *        id
 *        name
 *        email
 *        phone
 *        orders(
 *          filtersSet: {
 *            conjunction: and,
 *            filtersSet: [
 *              {
 *                field: address,
 *                operator: equals,
 *                value: "123 Main St"
 *              }
 *            ]
 *          }
 *          pagination: {
 *            limit: 10
 *            offset: 0
 *          }
 *        ) {
 *          id
 *          address
 *        }
 *      }
 *    }
 *  }
 * }
 */
queryBuilder.selectFrom('customers').select([
  'id',
  'name',
  'email',
  'phone',
  queryBuilder =>
    queryBuilder
      .selectFrom('orders')
      .select(['id', 'address'])
      .where(() => {
        return queryBuilder.where('address', '=', '123 Main St');
      })
      .limit(10)
      .offset(0),
]);

/**
 *
 * Insert with link field multiple values
 * {
 *  id: number;
 *  name: string;
 *  email: string;
 *  phone: string;
 *  orders: {id: number, address: string}[];
 * }
 */
queryBuilder.insertInto('customers').values({
  name: 'John Doe',
  email: 'test@example.com',
  phone: '1234567890',
  orders: [
    { id: 1, address: '123 Main St' },
    { id: 2, address: '456 Main St' },
  ],
});
