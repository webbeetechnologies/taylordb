import { createQueryBuilder } from '../src/index.js';
import { TaylorDatabase } from './type.js';

const queryBuilder = createQueryBuilder<TaylorDatabase>({
  apiKey: '',
  baseUrl: '',
  baseId: '',
});

queryBuilder
  .plugin('email')
  .action('send')
  .input({
    body: '',
    to: '',
    subject: '',
  })
  .execute();
