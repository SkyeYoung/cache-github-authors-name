import type { Configuration } from 'webpack';

const webpackConfig: Configuration = {
  entry: './index.ts',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.[tj]s$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'swc-loader',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      fs: false,
      path: false,
      os: false,
      util: false,
      child_process: false,
    },
  },
};

export default webpackConfig;
