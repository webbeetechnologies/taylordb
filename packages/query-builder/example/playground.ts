import {
  avg,
  count,
  createQueryBuilder,
  max,
  median,
  min,
  range,
  stdDev,
  sum,
  unique,
} from '../src/index.js';
import { TaylorDatabase } from './type.js';

const queryBuilder = createQueryBuilder<TaylorDatabase>({
  apiKey: 'example-api-key',
  baseUrl: 'https://example.taylordb.ai',
  baseId: 'example-base-id',
});

const simpleSelect = queryBuilder
  .selectFrom('backlog')
  .select(['id', 'title', 'status', 'prio', 'est', 'date'])
  .where('title', 'contains', 'login')
  .where('status', '=', 'Option 1')
  .where('prio', 'hasAnyOf', ['Option 1'])
  .where('est', '>=', 3)
  .where('date', 'isWithIn', 'pastWeek')
  .orderBy('title', 'asc')
  .orderBy('est', 'desc')
  .limit(25)
  .offset(10)
  .compile();

const selectAllWithPagination = queryBuilder
  .selectFrom('epics')
  .selectAll()
  .where('priority', '=', '☄️ Must Have')
  .where('label', 'hasAllOf', ['Option 1'])
  .paginate(2, 10)
  .compile();

const nestedWhere = queryBuilder
  .selectFrom('backlog')
  .select(['id', 'title', 'description'])
  .where('description', 'isNotEmpty')
  .where(builder =>
    builder
      .where('title', 'startsWith', 'API')
      .orWhere('description', 'contains', 'validation'),
  )
  .orWhere(builder =>
    builder.where('lywrt', 'isEmpty').where('loggedTime', '<', 2),
  )
  .compile();

const crossTableFilter = queryBuilder
  .selectFrom('backlog')
  .select(['id', 'title'])
  .where('sprint', 'hasAnyOf', sprint =>
    sprint.where('name', 'contains', 'Sprint').where('status', '=', 'Option 1'),
  )
  .where('epic', 'hasAnyOf', epic =>
    epic
      .where('priority', '=', '☄️ Must Have')
      .where('label', 'hasAnyOf', ['Option 2']),
  )
  .compile();

const relationshipByName = queryBuilder
  .selectFrom('backlog')
  .select(['id', 'title'])
  .with(['sprint', 'epic', 'responsible'])
  .compile();

const relationshipByObject = queryBuilder
  .selectFrom('backlog')
  .select(['id', 'title'])
  .with({

    sprint: sprint =>
      sprint
        .select(['id', 'name', 'status', 'start', 'end'])
        .where('status', '=', 'Option 1')
        .orderBy('start', 'desc')
        .limit(5),
    epic: epic =>
      epic
        .select(['id', 'name', 'priority'])
        .with({
          blocks: blockedEpic =>
            blockedEpic
              .select(['id', 'name', 'status'])
              .where('status', '=', 'Option 2'),
          collaborator: collaborator =>
            collaborator.select(['id', 'name', 'emailAddress']),
        })
        .offset(1),
  })
  .compile();

const insertOne = queryBuilder
  .insertInto('backlog')
  .values({
    title: 'Typed backlog item',
    status: 'Option 1',
    prio: 'Option 2',
    est: 5,
    responsible: [1],
    coResponsible: [2, 3],
    sprint: [10],
    epic: [20],
    attachment: [100],
    description: 'Created from the playground',
    types: [],
    loggedTime: 0,
    date: '2026-05-19',
  })
  .returning(['id', 'title', 'status', 'est'])
  .compile();

const insertMany = queryBuilder
  .insertInto('epics')
  .values([
    {
      name: 'Runtime schema',
      status: 'Option 1',
      collaborator: [1],
      area: 'Option 1',
      blocks: [],
      priority: '☄️ Must Have',
      label: ['Option 1'],
      start: '2026-05-19',
      end: '2026-06-19',
    },
    {
      name: 'Validation surface',
      status: 'Option 2',
      collaborator: [2],
      area: 'Option 2',
      blocks: [1],
      priority: ' 🧁 Nice To Have',
      label: ['Option 2'],
      start: '2026-06-20',
      end: '2026-07-20',
    },
  ])
  .returning(['id', 'name', 'priority'])
  .compile();

const updateWithScalarAndLinks = queryBuilder
  .update('backlog')
  .set({
    title: 'Updated title',
    status: 'Option 2',
    prio: 'Option 1',
    est: 8,
    responsible: { newIds: [4], deletedIds: [1] },
    coResponsible: [2, 5],
    attachment: {
      newAttachments: [],
      deletedUrls: ['https://media.taylordb.ai/files/old.png'],
    },
    types: [],
    date: '2026-05-20',
  })
  .where('id', '=', 1)
  .where('title', 'isNotEmpty')
  .compile();

const deleteQuery = queryBuilder
  .deleteFrom('backlog')
  .where('id', '=', 99)
  .compile();

const aggregateWithAllMetricHelpers = queryBuilder
  .aggregateFrom('backlog')
  .where('date', 'isWithIn', { value: 'daysAgo', date: 30 })
  .groupBy('status', 'asc')
  .groupBy('prio', 'desc')
  .metrics({
    idCount: count('id'),
    estSum: sum('est'),
    estAverage: avg('est'),
    estMedian: median('est'),
    estMin: min('est'),
    estMax: max('est'),
    estRange: range('est'),
    estStdDev: stdDev('est'),
    uniqueTitles: unique('title'),
  })
  .orderBy('status', 'asc')
  .paginate(1, 20)
  .compile();

const aggregateWithoutGroupBy = queryBuilder
  .aggregateFrom('epics')
  .where('priority', 'hasAnyOf', ['☄️ Must Have'])
  .metrics({
    totalEpics: count('id'),
    orderAverage: avg('order'),
    orderMax: max('order'),
  })
  .limit(10)
  .compile();

const pluginEmailAction = queryBuilder
  .plugin('email')
  .action('send')
  .input({
    body: 'Typed email body',
    subject: 'Typed subject',
    to: 'team@example.com',
  })
  .compile();

const pluginSmsAction = queryBuilder
  .plugin('sms')
  .action('send')
  .input({
    body: 'Typed SMS body',
    to: '+15555550100',
  })
  .compile();

const batchQuery = queryBuilder
  .batch([
    queryBuilder.selectFrom('backlog').select(['id', 'title']).limit(5),
    queryBuilder
      .insertInto('sprints')
      .values({
        name: 'Sprint 1',
        status: 'Option 1',
        start: '2026-05-19',
        end: '2026-06-02',
      })
      .returning(['id', 'name']),
    queryBuilder
      .update('epics')
      .set({ priority: ' 🧁 Nice To Have', label: ['Option 1'] })
      .where('id', '=', 1),
    queryBuilder.plugin('email').action('send').input({
      to: 'team@example.com',
      subject: 'Batch action',
      body: 'This is part of a batch',
    }),
  ])
  .compile();

const selectSubscriptionUnsubscribe = queryBuilder
  .selectFrom('backlog')
  .select(['id', 'title'])
  .where('status', '=', 'Option 1')
  .subscribe(records => {
    records.forEach(record => {
      record.id.toFixed();
      record.title?.toUpperCase();
    });
  });

const aggregateSubscriptionUnsubscribe = queryBuilder
  .aggregateFrom('backlog')
  .groupBy('status')
  .metrics({ total: count('id') })
  .subscribe(records => {
    records.forEach(record => {
      return record.status === 'Option 1' && record.total === 1;
    });
  });

const batchSubscriptionUnsubscribe = queryBuilder
  .batch([
    queryBuilder.selectFrom('backlog').select(['id', 'title']),
    queryBuilder.selectFrom('epics').select(['id', 'name', 'priority']),
  ])
  .subscribe((backlogRecords, epicRecords) => {
    backlogRecords.forEach(record => record.title?.toUpperCase());
    epicRecords.forEach(record => record.priority?.toUpperCase());
  });

async function executeExamples() {
  const rows = await queryBuilder
    .selectFrom('backlog')
    .select(['id', 'title', 'status'])
    .execute();

  const firstEpic = await queryBuilder
    .selectFrom('epics')
    .select(['id', 'name', 'priority'])
    .executeTakeFirst();

  const totalOpenBacklog = await queryBuilder
    .selectFrom('backlog')
    .where('status', '=', 'Option 1')
    .count();

  const inserted = await queryBuilder
    .insertInto('backlog')
    .values({ title: 'Execute insert example', status: 'Option 1' })
    .returning(['id', 'title'])
    .executeTakeFirst();

  const updated = await queryBuilder
    .update('backlog')
    .set({ loggedTime: 3 })
    .where('id', '=', 1)
    .execute();

  const deleted = await queryBuilder
    .deleteFrom('backlog')
    .where('id', '=', 2)
    .execute();

  const aggregateRows = await queryBuilder
    .aggregateFrom('backlog')
    .groupBy('status')
    .metrics({ total: count('id') })
    .execute();

  const pluginResult = await queryBuilder
    .plugin('email')
    .action('send')
    .input({ to: 'team@example.com', subject: 'Executed', body: 'Hello' })
    .execute();

  const transactionResult = await queryBuilder.transaction(async tx => {
    const sprint = await tx
      .insertInto('sprints')
      .values({ name: 'Transactional sprint', status: 'Option 1' })
      .returning(['id', 'name'])
      .executeTakeFirst();

    await tx
      .plugin('sms')
      .action('send')
      .input({ to: '+15555550100', body: 'Created sprint' })
      .execute();

    return sprint;
  });

  const uploadedAttachments = await queryBuilder.uploadAttachments([
    {
      file: new Blob(['example'], { type: 'text/plain' }),
      name: 'example.txt',
    },
  ]);

  await queryBuilder
    .insertInto('backlog')
    .values({
      title: 'Attachment insert example',
      attachment: uploadedAttachments,
    })
    .execute();

  return {
    rows,
    firstEpic,
    totalOpenBacklog,
    inserted,
    updated,
    deleted,
    aggregateRows,
    pluginResult,
    transactionResult,
  };
}

void [
  simpleSelect,
  selectAllWithPagination,
  nestedWhere,
  crossTableFilter,
  relationshipByName,
  relationshipByObject,
  insertOne,
  insertMany,
  updateWithScalarAndLinks,
  deleteQuery,
  aggregateWithAllMetricHelpers,
  aggregateWithoutGroupBy,
  pluginEmailAction,
  pluginSmsAction,
  batchQuery,
  selectSubscriptionUnsubscribe,
  aggregateSubscriptionUnsubscribe,
  batchSubscriptionUnsubscribe,
  executeExamples,
];
