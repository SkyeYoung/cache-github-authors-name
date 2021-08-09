import { cacheGitHubAuthorsName } from './src';

cacheGitHubAuthorsName()
  .then(() => {
    console.log('Build the cache successfully');
  })
  .catch((err) => {
    console.error(err);
    console.error('Failed to build the cache');
  });
