import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GITHUB_ACCESS_TOKEN) {
  console.error('has no GITHUB_ACCESS_TOKEN');
  process.exit(1);
}
