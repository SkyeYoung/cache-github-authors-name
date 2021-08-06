import { readFileSync } from 'fs';
import path from 'path';
import {
  cacheInfo,
  Config,
  CONFIG_PATH,
  DEFAULT_CONFIG,
  getAuthorFromCommit,
  getGitHubInfo,
  getLog,
  initRepo,
  loadConfig,
  scanFiles,
} from '../src';

const configPath = path.resolve(__dirname, './gai.test.json');
const config: Config = { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(configPath, 'utf-8')) };
const wrongConfig = {
  ...config,
  local: 'dist',
  remote: 'wrong url',
};

describe('load config', () => {
  test('with wrong path',
    () => expect(loadConfig(''))
      .rejects
      .toThrowError(`"${CONFIG_PATH}" does not exists`));
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

describe('get log', () => {
  test('with real path', () => expect(initRepo(config)
    .then((v) => getLog(v, 'fe.Dockerfile')))
    .resolves
    .toBeDefined());
});

describe('get author info from commit', () => {
  const commitConfig = {
    owner: 'JUST-NC',
    repo: 'syn-sys',
    commit: 'fdb2db05884504bb70b1177b4ccc8dba942a332',
  };
  test('with wrong commit id', () => expect(getAuthorFromCommit(commitConfig))
    .rejects
    .toThrowError(`cannot find commit "${commitConfig.commit}" in "${commitConfig.owner}/${commitConfig.repo}"`));
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

  test('with wrong email (must query in github)',
    () => expect(getGitHubInfo(wrongCommit))
      .resolves
      .toBeDefined(), 1000 * 20);
});

describe('cache info', () => {
  test('with real config', () => expect(loadConfig(configPath)
    .then((con) => Promise.allSettled([con, initRepo(con), scanFiles(con.local)]))
    .then(([con, git, files]) => {
      if (con.status === 'fulfilled' && git.status === 'fulfilled' && files.status === 'fulfilled') {
        return cacheInfo(git.value, files.value, con.value);
      } else {
        throw new Error('无法初始化');
      }
    }))
    .resolves
    .toBeUndefined(), 1000 * 2000);
});
