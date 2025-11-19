import { AnySubscribableQueryBuilder } from './batch-query-builder.js';
import { SocketConnection } from './socket-connection.js';

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
  #socketConnection: SocketConnection;
  #transactionId?: string;

  constructor(
    baseUrl: string,
    apiKey: string,
    transactionId?: string,
    socketConnection?: SocketConnection,
  ) {
    this.#baseUrl = baseUrl;
    this.#apiKey = apiKey;
    this.#transactionId = transactionId;
    this.#socketConnection =
      socketConnection ??
      new SocketConnection({
        baseUrl,
        apiKey,
        clientId: generateUUID(),
      });
  }

  get isInTransaction(): boolean {
    return !!this.#transactionId;
  }

  withTransactionId(transactionId: string) {
    return new Executor(
      this.#baseUrl,
      this.#apiKey,
      transactionId,
      this.#socketConnection,
    );
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
    return this.#socketConnection.rawRequest(
      query,
      variables,
      headers,
      this.#transactionId,
    );
  }

  subscribe<TResult>(
    builders: AnySubscribableQueryBuilder[],
    callback: (result: TResult) => void,
  ) {
    const metadatas = builders.map(b => (b as any)._prepareMetadata());
    return this.#socketConnection.subscribe(metadatas, callback);
  }
}
