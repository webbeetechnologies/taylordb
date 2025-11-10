interface Compilable {
  compile(): {query: string; variables: Record<string, any>};
}

export class Executor {
  #baseUrl: string;
  #apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.#baseUrl = baseUrl;
    this.#apiKey = apiKey;
  }

  async execute<T>(builder: Compilable): Promise<T> {
    const {query, variables} = builder.compile();

    const response = await fetch(this.#baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.#apiKey}`,
        schema: 'readable'
      },
      body: JSON.stringify({query, variables}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(jsonResponse.errors)}`);
    }

    if (jsonResponse.data && Array.isArray(jsonResponse.data.execute)) {
      return jsonResponse.data.execute as T[];
    }

    throw new Error('Unexpected response format');
  }
}
