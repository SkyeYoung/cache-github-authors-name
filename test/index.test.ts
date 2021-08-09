import { readFileSync } from 'fs';
import path from 'path';
import { rm } from 'fs/promises';
import {
  cacheGitHubAuthorsName,
  cacheInfo,
  Config,
  DEFAULT_CONFIG,
  getAuthorFromCommit,
  getGitHubInfo,
  initRepo,
  loadConfig,
  scanFiles,
} from '../src';

const configPath = path.resolve(__dirname, './gai.test.json');
const config: Config = {
  ...DEFAULT_CONFIG,
  ...JSON.parse(readFileSync(configPath, 'utf-8')),
};
const wrongConfig = {
  ...config,
  local: 'dist',
  remote: 'wrong url',
};
const clean = (con: Config) => Promise.all([con.local, con.cachePath].map((v) => rm(v, {
  recursive: true,
  force: true,
})));

describe('load config', () => {
  test('with wrong path',
    () => expect(loadConfig('wrong'))
      .rejects
      .toThrowError('"wrong" does not exists'));
  test('with wrong config',
    () => expect(loadConfig(wrongConfig))
      .rejects
      .toThrowError('wrong remote, it should be a url string'));

  test('with real path and real config',
    () => expect(loadConfig(configPath))
      .resolves
      .toBeDefined());
});

describe('init repo', () => {
  test('with wrong remote', () => expect(initRepo(wrongConfig))
    .rejects
    .toThrowError('not a repo, and has not a legal remote url'));

  test('with real remote and local (maybe long time)', () => expect(initRepo(config))
    .resolves
    .toBeDefined(), 1000 * 20);
});

describe('scan files', () => {
  test('with real path', () => expect(scanFiles(config.local))
    .resolves
    .toBeDefined());

  test('with wrong path', () => expect(scanFiles(wrongConfig.remote))
    .rejects
    .toThrowError(`cannot read "${wrongConfig.remote}"`));
});

describe('get author info from commit', () => {
  const cConfig = {
    owner: 'JUST-NC',
    repo: 'syn-sys',
    commit: 'fdb2db05884504bb70b1177b4ccc8dba942a332',
  };
  test('with wrong commit id', () => expect(getAuthorFromCommit(cConfig))
    .rejects
    .toThrowError(`cannot find commit "${cConfig.commit}" in "${cConfig.owner}/${cConfig.repo}"`),
  1000 * 20);
});

describe('get GitHub name', () => {
  const commit = {
    email: 'iskyex@outlook.com',
    owner: 'JUST-NC',
    repo: 'syn-sys',
    commit: 'afdb2db05884504bb70b1177b4ccc8dba942a332',
  };

  const wrongCommit = {
    ...commit,
    email: 'wrong email',
  };

  const noReplyCommit = {
    ...commit,
    email: '123+SkyeYoung@users.noreply.github.com',
  };

  test('with real email (not noreply)', () => expect(getGitHubInfo(commit))
    .resolves
    .toBeDefined(), 1000 * 20);

  test('with real email (noreply)', () => expect(getGitHubInfo(noReplyCommit))
    .resolves
    .toBeDefined());

  test('with wrong email (i.e. must query in github)',
    () => expect(getGitHubInfo(wrongCommit))
      .resolves
      .toBeDefined(), 1000 * 200);
});

describe('cache info', () => {
  test('with real config', () => expect(loadConfig(configPath)
    .then(async (con) => {
      await clean(con);
      return Promise.all([con, initRepo(con)]);
    })
    .then(([con, git]) => cacheInfo(git, con)))
    .resolves
    .toBeUndefined(), 1000 * 2000);
});

describe('cache git authors info', () => {
  test('with real config', () => expect(clean(config)
    .then(() => cacheGitHubAuthorsName(configPath)))
    .resolves
    .toBeUndefined(), 1000 * 2000);
});
