import isUrl from 'is-url';
import { access, mkdir, readFile } from 'fs/promises';
import path from 'path';
import simpleGit, { CheckRepoActions } from 'simple-git';
import { constants } from 'fs';
import { SimpleGit } from 'simple-git/promise';

export interface GAIConfig {
  local: string;
  remote?: string;
  branch?: string;
  directory: string;
  cachePath: string;
}

const CONFIG_PATH = './gai.test.json';
const DEFAULT_CONFIG: GAIConfig = {
  local: '.',
  directory: '.',
  branch: 'master',
  cachePath: 'gai-cache.json',
};

const loadConfig = (config: string | Partial<GAIConfig>): Promise<GAIConfig> => (
  typeof config === 'string'
    ? readFile(path.resolve(__dirname, config || CONFIG_PATH), 'utf-8')
      .catch(() => {
        throw new Error(`"${CONFIG_PATH}" does not exists`);
      })
      .then<GAIConfig>((value) => JSON.parse(value))
    : new Promise<Partial<GAIConfig>>((resolve) => resolve(config || {})))
  .then((v) => {
    if (v?.remote && !isUrl(v.remote)) {
      throw new Error('wrong remote, it should be a url string');
    }
    return v;
  })
  .then((custom) => ({ ...DEFAULT_CONFIG, ...custom }));

const initRepo = (config: GAIConfig): Promise<SimpleGit> => {
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
      } else if (remote && isUrl(remote)) {
        return repo.clone(remote, '.');
      } else {
        throw new Error('not a repo, and has not a legal remote url');
      }
    });
};

export {
  CONFIG_PATH, DEFAULT_CONFIG, loadConfig, initRepo,
};
