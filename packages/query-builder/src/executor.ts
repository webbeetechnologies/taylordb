import { AnySubscribableQueryBuilder } from './batch-query-builder.js';
import { SubscriptionManager } from './subscription-manager.js';

interface Compilable {
  compile(): { query: string; variables: Record<string, any> };
}

const generateUUID = () => {
  if (globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // A simple fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class Executor {
  #baseUrl: string;
  #apiKey: string;
  #subscriptionManager: SubscriptionManager;

  constructor(baseUrl: string, apiKey: string) {
    this.#baseUrl = baseUrl;
    this.#apiKey = apiKey;
    this.#subscriptionManager = new SubscriptionManager(this, {
      baseUrl,
      apiKey,
      clientId: generateUUID(),
    });
  }

  async execute<T>(builder: Compilable): Promise<T> {
    const { query, variables } = builder.compile();
    return this.rawRequest(query, variables);
  }

  async rawRequest<T>(
    query: string,
    variables: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await fetch(this.#baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.#apiKey}`,
        schema: 'readable',
        ...(headers ? { ...headers } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`,
      );
    }

    const jsonResponse = await response.json();

    if (jsonResponse.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(jsonResponse.errors)}`);
    }

    if (jsonResponse.data) {
      const [firstKey] = Object.keys(jsonResponse.data);
      if (Array.isArray(jsonResponse.data[firstKey])) {
        return jsonResponse.data[firstKey] as T;
      }
      return jsonResponse.data;
    }

    throw new Error('Unexpected response format');
  }

  async subscribe<TResult>(
    builders: AnySubscribableQueryBuilder[],
    callback: (result: TResult) => void,
  ) {
    const metadatas = builders.map(b => (b as any)._prepareMetadata());
    return this.#subscriptionManager.subscribe(metadatas, callback);
  }
}
