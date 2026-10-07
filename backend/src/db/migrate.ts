import { config } from '../config.ts';
import { openDb } from './client.ts';

const db = await openDb(config.databaseUrl, process.env.DATABASE_AUTH_TOKEN);
db.$client.close();
console.log('DB migrations applied.');
