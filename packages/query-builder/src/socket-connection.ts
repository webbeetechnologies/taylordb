import EventEmitter from 'eventemitter3';
import jsonpatch from 'fast-json-patch';
import { io, Socket } from 'socket.io-client';
import { withResolver } from './with-resolver.js';

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

export type DriverSubscriptionResponse = {
  id: string;
  delta: object[];
  tableName: string;
  subscriptionId: string;
};

type Subscription = {
  data: any;
  callback: (data: any) => void;
};

export class SocketConnection extends EventEmitter {
  #socket: Socket | null = null;
  #subscriptions = new Map<string, Subscription>();
  #connectionPromise: Promise<void> | null = null;

  constructor(
    private config: {
      baseUrl: string;
      apiKey: string;
      timeZone?: string;
      clientId?: string;
    },
  ) {
    super();
  }

  #connect(): Promise<void> {
    if (this.#socket?.connected) {
      return Promise.resolve();
    }

    if (this.#connectionPromise) {
      return this.#connectionPromise;
    }

    this.#connectionPromise = new Promise((resolve, reject) => {
      try {
        const socketUrl = this.config.baseUrl
          .replace(/^http/, 'ws')
          .replace('api', 'bamboo');
        this.#socket = io(socketUrl, {
          auth: {
            token: this.config.apiKey,
            'time-zone': this.config.timeZone || 'UTC',
            'client-id': this.config.clientId,
          },
          query: {},
        });

        this.#socket.on('successful', () => {
          this.#socket?.on('patch', this.#handlePatch.bind(this));

          this.#socket?.on('query-response', (response: any) => {
            console.log('[LOGGED] First response came');
            this.emit(response.queryId, response);
          });

          this.#socket?.emit('subscribe', { clientId: this.config.clientId });

          console.log('[LOGGED] connected');

          resolve();
        });

        this.#socket.on('disconnect', () => {
          this.#socket = null;
          this.#connectionPromise = null;
        });

        this.#socket.on('connect_error', err => {
          this.#socket = null;
          this.#connectionPromise = null;
          reject(err);
        });
      } catch (error) {
        this.#connectionPromise = null;
        reject(error);
      }
    });

    return this.#connectionPromise;
  }

  public async rawRequest<T>(
    query: string,
    variables: Record<string, any>,
    headers?: Record<string, string>,
    transactionId?: string,
  ): Promise<T> {
    await this.#connect();
    const queryId = generateUUID();

    const { promise, resolve } = withResolver<T>();

    this.once(queryId, (response: any) => {
      console.log('[LOGGED] the first response');

      if (response.errors) {
        throw new Error(JSON.stringify(response.errors));
      }

      const firstKey = Object.keys(response.data)[0];
      if (firstKey) {
        resolve(response.data[firstKey]);
      } else {
        resolve(response.data);
      }
    });

    if (!headers) {
      headers = {};
    }

    headers = {
      ...headers,
      schema: 'readable',
    };

    console.log('[LOGGED] the first request');

    this.emit('query', {
      query,
      variables,
      queryId,
      ...(transactionId ? { transactionId } : {}),
      ...(headers ? { options: { ...headers } } : {}),
    });

    return promise;
  }

  public async subscribe<TResult>(
    metadatas: any[],
    callback: (...results: TResult[]) => void,
  ) {
    await this.#connect();

    const param = metadatas.map(metadata => ({
      metadata,
      options: {
        returns: ['patch', 'affectedFields'],
      },
    }));

    const result = await this.rawRequest<{
      subscriptions: {
        subscribe: { subscriptionId: string; data: any }[];
      };
    }>(
      `
      query ($param: [SubscriptionMetadataInput]!) {
        plugins {
          subscriptions {
            subscribe(subscriptions: $param) {
              subscriptionId
              data
            }
          }
        }
      }
      `,
      { param },
      { 'client-id': this.config.clientId },
    );

    const subscriptions = result.subscriptions.subscribe;
    const initialData = subscriptions.map(s => s.data);

    for (const sub of subscriptions) {
      this.#subscriptions.set(sub.subscriptionId, {
        data: sub.data,
        callback: (patchedData: any) => {
          // This needs to be more robust for batching.
          // For now, we'll just update the single data and call back.
          const idx = subscriptions.findIndex(
            s => s.subscriptionId === sub.subscriptionId,
          );
          if (idx !== -1) {
            initialData[idx] = patchedData;
            callback(...initialData);
          }
        },
      });
    }

    callback(...(initialData as TResult[]));

    return {
      unsubscribe: async () => {
        const subscriptionIds = subscriptions.map(s => s.subscriptionId);
        for (const id of subscriptionIds) {
          this.#subscriptions.delete(id);
        }

        await this.rawRequest(
          `query RemoveSubscription ($subscriptionIds: [String]) {
            plugins {
              subscriptions {
                unsubscribe(subscriptionIds: $subscriptionIds)
              }
            }
          }`,
          { subscriptionIds },
        );
      },
    };
  }

  public emit(event: string | symbol, ...args: any[]): boolean {
    if (event === 'query') {
      this.#socket?.emit('query', ...args);
      return true;
    }
    return super.emit(event, ...args);
  }

  #handlePatch(response: { patches: DriverSubscriptionResponse[] }) {
    for (const patch of response.patches) {
      const sub = this.#subscriptions.get(patch.subscriptionId);
      if (sub) {
        // @ts-ignore
        const { newDocument } = jsonpatch.applyPatch(sub.data, patch.delta);
        sub.data = newDocument;
        sub.callback(newDocument);
      }
    }
  }
}
