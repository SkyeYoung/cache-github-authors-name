import path from 'path';
import type { Configuration } from 'webpack';

const webpackConfig: Configuration = {
  entry: './src/index.ts',
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
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

export default webpackConfig;
