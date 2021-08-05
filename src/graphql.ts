import { gql } from './util';

export interface SearchUserInfo {
  search: {
    nodes: Array<{
      login: string;
    }>;
  };
}

export const searchUserInfo = gql`
  query searchUserInfo($queryStr: String!){
    search(query: $queryStr, type: USER, first: 1){
      nodes {
        ... on User {
          login
        }
      }
    }
  }`;

export interface GetUserInfoFromCommit {
  repository: {
    object: {
      history: {
        nodes: Array<{
          author: {
            name: string;
          }
        }>
      }
    }
  };
}

export const getUserInfoFromCommit = gql`
  query getUserInfoFromCommit($repo: String!, $owner: String!, $commit: GitObjectID!){
    repository(name: $repo, owner: $owner){
      object(oid: $commit){
        ... on Commit {
          history(first: 1){
            nodes {
              author {
                name
              }
            }
          }
        }
      }
    }
  }`;
