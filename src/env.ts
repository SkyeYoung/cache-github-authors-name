import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GITHUB_ACCESS_TOKEN) {
  throw new Error('has no GITHUB_ACCESS_TOKEN');
}
