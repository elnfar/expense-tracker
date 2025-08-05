import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  databaseUrl: string;
  nodeEnv: string;
}

const config: Config = {
  port: parseInt(process.env['PORT'] || '8080', 10),
  databaseUrl: process.env['DATABASE_URL'] || '',
  nodeEnv: process.env['NODE_ENV'] || 'development',
};

export default config; 