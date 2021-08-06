import {
  access, mkdir, readdir, readFile, writeFile,
} from 'fs/promises';
import path from 'path';
import simpleGit, { CheckRepoActions } from 'simple-git';
import { constants } from 'fs';
import { SimpleGit } from 'simple-git/promise';
import { validate as isEmail } from 'isemail';
import isGitUrl from 'is-git-url';
import { decodeRemote, encodeRemote, graphqlWithAuth } from './src/util';
import {
  getUserInfoFromCommit,
  GetUserInfoFromCommit,
  searchUserInfo,
  SearchUserInfo,
} from './src/graphql';

interface DefaultConfig {
  local: string;
  branch: string;
  directory: string;
  cachePath: string;
}

export interface CustomConfig extends Partial<DefaultConfig> {
  remote: string;
  owner: string;
  repo: string;
}

export type Config = Required<CustomConfig>;

const CONFIG_PATH = './gai.test.json';
const DEFAULT_CONFIG: DefaultConfig = {
  local: '.',
  directory: '.',
  branch: 'master',
  cachePath: 'gai-cache.json',
};

const loadConfig = (config: string | CustomConfig = CONFIG_PATH): Promise<Config> => (
  (typeof config === 'string'
    ? readFile(path.resolve(__dirname, config), 'utf-8')
      .catch(() => {
        throw new Error(`"${CONFIG_PATH}" does not exists`);
      })
      .then<CustomConfig>((value) => JSON.parse(value))
    : Promise.resolve<CustomConfig>(config))
    .then((v) => {
      let custom = v;
      if (v.local) custom.local = path.join(v.local);
      if (v.cachePath) custom.cachePath = path.join(v.cachePath);
      if (v.remote) {
        if (!isGitUrl(v.remote)) {
          throw new Error('wrong remote, it should be a url string');
        }
        if (!v.repo || !v.owner) {
          custom = {
            ...custom,
            ...decodeRemote(v.remote),
          };
        }
      } else if (v.repo && v.owner) {
        encodeRemote(v.owner, v.repo);
      }

      return custom;
    })
    .then((custom) => ({ ...DEFAULT_CONFIG, ...custom }))
);

const initRepo = (config: Config): Promise<SimpleGit> => {
  const {
    remote,
    local,
  } = config;
  let repo: SimpleGit;

  return access(local, constants.R_OK | constants.W_OK | constants.O_DIRECTORY)
    .catch(() => mkdir(local, { recursive: true }))
    .catch(() => {
      throw new Error(`cannot create ${local}`);
    })
    .then(() => {
      repo = simpleGit(local);
      return repo;
    })
    .then((v) => v.checkIsRepo(CheckRepoActions.IS_REPO_ROOT))
    .then((isRepo) => {
      if (isRepo) {
        return repo;
      } else if (remote && isGitUrl(remote)) {
        return repo.clone(remote, '.');
      } else {
        throw new Error('not a repo, and has not a legal remote url');
      }
    });
};

const scanFiles = (dirPath: string): Promise<string[]> => (
  dirPath.endsWith('.git')
    ? Promise.resolve([])
    : (
      readdir(dirPath, {
        encoding: 'utf-8',
        withFileTypes: true,
      })
        .catch(() => {
          throw new Error(`cannot read "${dirPath}"`);
        })
        .then<string[]>((v) => Promise.all(v.map((file) => {
          const filePath = path.join(dirPath, file.name);
          return file.isDirectory()
            ? scanFiles(filePath)
            : filePath;
        }) as Array<string | Promise<string>>))
        .then((arr) => arr.flat())
    )
);

const getLog = (git: SimpleGit, filePath: string, from?: string) => git.log({
  file: filePath,
  from,
});

const getAuthorFromSearch = (email: string) => (
  graphqlWithAuth<SearchUserInfo>(searchUserInfo, { queryStr: email })
    .then(({ search: { nodes } }) => {
      if (nodes.length > 0) {
        return nodes[0].login;
      } else {
        throw new Error(`cannot find the info of "${email}"`);
      }
    })
);

const getAuthorFromCommit = (props: {
  commit: string;
  owner: string;
  repo: string;
}) => (
  graphqlWithAuth<GetUserInfoFromCommit>(
    getUserInfoFromCommit,
    props,
  )
    .then((v) => {
      const { nodes } = v.repository.object.history;
      return nodes[0].author.name;
    })
    .catch(() => {
      throw new Error(`cannot find commit "${props.commit}" in "${props.owner}/${props.repo}"`);
    })
);

export type GetGitHubInfo = ((props: {
  email: string;
  owner: string;
  repo: string;
  commit: string;
  skipSearch?: boolean;
}) => Promise<string>)

const getGitHubInfo: GetGitHubInfo = (props) => {
  const {
    email,
    skipSearch = false,
    ...others
  } = props;
  const promises: Array<string | Promise<string>> = [];
  let isNoReply = false;

  if (isEmail(email)) {
    const parts = email.split('@') as [string, string];
    // sample '123+name@users.noreply.github.com
    if (parts[1] === 'users.noreply.github.com') {
      isNoReply = true;
      promises.push(parts[0].split('+')[1] as string);
    } else {
      if (!skipSearch) promises.push(getAuthorFromSearch(email));
    }
  }

  if (!isNoReply) {
    promises.push(getAuthorFromCommit(others));
  }

  return Promise.any(promises);
};

const writeCache = (config: Config, cacheMap: Map<string, string>) => (
  writeFile(path.resolve(__dirname, config.cachePath), JSON.stringify(Object.fromEntries(cacheMap)))
    .catch(() => {
      throw new Error(`cannot write to ${config.cachePath}`);
    })
);

const readCache = (config: Config): Promise<Map<string, string>> => (
  readFile(path.resolve(__dirname, config.cachePath))
    .then((buf) => buf.toString())
    .then((v) => new Map(JSON.parse(v)) as Map<string, string>)
    .catch(() => new Map<string, string>()));

const cacheInfo = async (git: SimpleGit, filePaths: string[], config: Config) => {
  const len = config.local.length;
  const infoCache = await readCache(config);
  const commits = new Set<string>();

  await Promise.allSettled(filePaths.map((f) => getLog(git, f.slice(len + 1), infoCache.get('commit'))
    .then((v) => {
      if (v.latest) infoCache.set('commit', v.latest.hash);
      return v.all;
    })
    .then((logs) => Promise.allSettled(logs.map(async (log) => {
      if (!commits.has(log.hash)) {
        commits.add(log.hash);
        if (!infoCache.has(log.author_email)) {
          const name = await getGitHubInfo({
            email: log.author_email,
            commit: log.hash,
            owner: config.owner,
            repo: config.repo,
          });
          infoCache.set(log.author_email, name);
        }
      }
    })))))
    .then(() => {
      writeCache(config, infoCache);
    });
};

export {
  CONFIG_PATH,
  DEFAULT_CONFIG,
  loadConfig,
  initRepo,
  scanFiles,
  getLog,
  getGitHubInfo,
  getAuthorFromCommit,
  cacheInfo,
};
