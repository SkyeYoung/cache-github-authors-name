import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  coverageDirectory: './.cache/jest/coverage',
  cacheDirectory: './.cache/jest/cache',
};

export default config;
