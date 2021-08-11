import arg from 'arg';
import { cacheGitHubAuthorsName } from './src';

Promise.resolve(arg({
  '--config': String,
  '-c': '--config',
}))
  .then((args) => cacheGitHubAuthorsName(args['--config']))
  .then(() => {
    console.log('Build the cache successfully');
  })
  .catch((err) => {
    console.error(err.message);
    console.error('Failed to build the cache');
  });
