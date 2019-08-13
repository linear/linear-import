import { Variables, ClientError } from './types';
import fetch from 'node-fetch';

interface ClientOptions {
  url?: string;
  headers?: { [key: string]: any };
}

/**
 * Linear GraphQL client.
 */
export class GraphQLClient {
  constructor(apiKey: string, options: ClientOptions = {}) {
    this.apiKey = apiKey;
    this.url = options.url || 'https://api.linear.app/graphql';
    this.options = options || {};
  }

  public request = async <T extends any>(
    query: string,
    variables?: Variables
  ): Promise<T> => {
    const { headers, ...others } = this.options;

    const body = JSON.stringify({
      query,
      variables: variables ? variables : undefined,
    });

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
      ...others,
    });

    const result = await response.json();

    if (response.ok && !result.errors && result.data) {
      return result.data;
    } else {
      const errorResult =
        typeof result === 'string' ? { error: result } : result;
      throw new ClientError(
        { ...errorResult, status: response.status },
        { query, variables }
      );
    }
  };

  // -- Private interface

  private apiKey: string;
  private url: string;
  private options: ClientOptions;
}

/**
 * Create a new Linear API client.
 *
 * Example:
 *
 * ```
 * import linearClient from '.';
 * const linear = linearClient(LINEAR_API_KEY);
 * linear(`
 *  query { ... }
 * `, { ...attrs });
 * ```
 */
export default (apiKey: string, options?: ClientOptions) => {
  const client = new GraphQLClient(apiKey, options);
  return client.request;
};
