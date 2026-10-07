import { createApp } from './app.ts';
import { config } from './config.ts';
import { openDb } from './db/client.ts';
import { deploymentAuth } from './auth.ts';

const auth = deploymentAuth();
const db = await openDb(config.databaseUrl, process.env.DATABASE_AUTH_TOKEN);

createApp(db, auth).listen(config.port, config.host, () => {
  console.log(`API ready: http://${config.host}:${config.port}  (DB: ${config.databaseUrl})`);
});
