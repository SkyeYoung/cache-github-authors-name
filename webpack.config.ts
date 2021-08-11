// eslint-disable-next-line import/no-extraneous-dependencies
import { BannerPlugin, Configuration } from 'webpack';
import path from 'path';

const webpackConfig: Configuration = {
  entry: './cli.ts',
  output: {
    path: path.resolve(__dirname, 'bin'),
  },
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
  plugins: [
    new BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
    }),
  ],
};

export default webpackConfig;
