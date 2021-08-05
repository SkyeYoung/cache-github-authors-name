import { decodeRemote, encodeRemote } from '../src/util';

describe('decode remote', () => {
  const remoteObj = {
    owner: 'xxx',
    repo: 'xx',
  };

  test('with wrong SSH link', () => {
    expect(() => decodeRemote('git@xxx/xx.git'))
      .toThrow('not a valid remote url');
  });

  test('with SSH link', () => {
    expect(decodeRemote('git@github.com:xxx/xx.git'))
      .toMatchObject(remoteObj);
  });

  test('with HTTPS link', () => {
    expect(decodeRemote('https://github.com/xxx/xx.git'))
      .toMatchObject(remoteObj);
  });
});

describe('encode remote', () => {
  test('with valid remote and repo', () => {
    expect(() => encodeRemote('xxx', 'xx'))
      .toBeDefined();
    expect(() => encodeRemote('xxx', 'xx', true))
      .toBeDefined();
  });

  test('with invalid remote or repo', () => {
    expect(() => encodeRemote('', 'xx'))
      .toThrowError(/^not valid/);

    expect(() => encodeRemote('xxx', ''))
      .toThrowError(/^not valid/);
  });
});
