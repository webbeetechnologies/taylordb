import { Provider } from '@nestjs/common';
import { createQueryBuilder } from '@taylordb/query-builder';
import { TaylorDatabase } from '../taylor.types';

export const TaylorDBProvider: Provider = {
  provide: 'TAYLOR_DB',
  useFactory: () => {
    const qb = createQueryBuilder<TaylorDatabase>({
      baseUrl: 'http://localhost:8090',
      baseId: '2afc6865-e139-42b1-bf63-5b783bb4736d',
      apiKey: 'your-api-key', // This should be in an env file
    });
    return qb;
  },
};
