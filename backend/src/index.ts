import { createApp } from './app.ts';
import { config } from './config.ts';
import { openDb } from './db/client.ts';

const db = await openDb(config.databaseUrl);

createApp(db).listen(config.port, config.host, () => {
  console.log(`API ready: http://${config.host}:${config.port}  (DB: ${config.databaseUrl})`);
});
