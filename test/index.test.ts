import { readFileSync } from 'fs';
import path from 'path';
import {
  CONFIG_PATH, DEFAULT_CONFIG, GAIConfig, initRepo, loadConfig,
} from '../index';

const configPath = path.resolve(__dirname, './gai.test.json');
const config: GAIConfig = { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(configPath, 'utf-8')) };
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
      .toMatchObject(config));
});

describe('init repo', () => {
  test('with wrong remote', () => expect(initRepo(wrongConfig))
    .rejects
    .toThrowError('not a repo, and has not remote url'));

  test('with real remote and local (maybe long time)', () => expect(initRepo(config))
    .resolves
    .toBeDefined(), 1000 * 20);
});
