import jsonpatch from 'fast-json-patch';
import { io, Socket } from 'socket.io-client';
import { Executor } from './executor.js';

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

export class SubscriptionManager {
  #socket: Socket | null = null;
  #subscriptions = new Map<string, Subscription>();
  #isConnecting = false;

  constructor(
    private executor: Executor,
    private config: {
      baseUrl: string;
      apiKey: string;
      timeZone?: string;
      clientId?: string;
    },
  ) {}

  async #connect() {
    if (this.#socket || this.#isConnecting) {
      return;
    }
    this.#isConnecting = true;

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

      this.#socket.emit('listen', { clientId: this.config.clientId });
      this.#socket.on('patch', this.#handlePatch.bind(this));

      await new Promise<void>((resolve, reject) => {
        if (!this.#socket) return reject('Socket not initialized');
        this.#socket.on('connect', () => {
          resolve();
        });
        this.#socket.on('connect_error', err => {
          reject(err);
        });
      });

      this.#socket.emit('subscribe', { clientId: this.config.clientId });
    } finally {
      this.#isConnecting = false;
    }
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

    const result = await this.executor.rawRequest<{
      plugins: {
        subscriptions: {
          subscribe: { subscriptionId: string; data: any }[];
        };
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

    const subscriptions = result.plugins.subscriptions.subscribe;
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
