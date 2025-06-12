import { graphql } from '@octokit/graphql';
import { IGraphQLClient } from '../interfaces/index.js';

export function createGraphQLClient(token: string): IGraphQLClient {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

  return {
    request: <T = any>(query: string, variables?: any): Promise<T> => {
      return graphqlWithAuth<T>(query, variables);
    },
  };
}