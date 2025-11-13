import { Provider } from '@nestjs/common';
import { createQueryBuilder } from '@taylordb/query-builder';
import { TaylorDatabase } from '../taylor.types';

export const TaylorDBProvider: Provider = {
  provide: 'TAYLOR_DB',
  useFactory: () => {
    const qb = createQueryBuilder<TaylorDatabase>({
      baseUrl: 'http://localhost:3001/graphql', // This should be in an env file
      apiKey: 'your-api-key', // This should be in an env file
    });
    return qb;
  },
};
