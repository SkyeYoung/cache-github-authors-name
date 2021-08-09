import { rename } from 'fs/promises';
import path from 'path';

describe('load env', () => {
  const env = path.resolve(__dirname, '../.env');
  const after = path.resolve(__dirname, '../.doodle');
  test('GITHUB_ACCESS_TOKEN', () => expect(
    () => rename(env, after)
      .then(() => import('../src/env'))
      .catch(async (err) => {
        await rename(after, env);
        throw err;
      }),
  )
    .rejects
    .toThrowError('has no GITHUB_ACCESS_TOKEN'));
});
