import { graphql } from '@octokit/graphql';
import './env';
import isGitUrl from 'is-git-url';

/**
 * Tag function
 * Used only in cooperation with webstorm's `JS GraphQL` plugin to achieve syntax highlighting
 * @param strings
 */
const gql = (strings: TemplateStringsArray) => strings.raw[0];

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
  },
});

/**
 * get the name of variables which value is falsy
 * @param args vars
 */
const lackListStr = (...args: any[]) => (
  args.filter((v) => !v)
    .map((v) => Object.keys({ v })[0])
    .join(', ')
);

const decodeRemote = (url: string) => {
  // sample: https://github.com/xxx/xx.git
  // sample: git@github.com:xxx/xx.git
  if (isGitUrl(url)) {
    const parts = url.split(':')[1].split('/');
    return {
      repo: parts[parts.length - 1].split('.')[0],
      owner: parts[parts.length - 2],
    };
  } else {
    throw new Error('not a valid remote url');
  }
};

const encodeRemote = (owner: string, repo: string, asSSH = false) => {
  if (asSSH) {
    return `git@github.com:${owner}/${repo}.git`;
  } else {
    return `https://github.com/${owner}/${repo}.git`;
  }
};

export {
  gql, graphqlWithAuth, lackListStr, decodeRemote, encodeRemote,
};
