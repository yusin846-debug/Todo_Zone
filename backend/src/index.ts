import { createApp } from './app.ts';
import { config } from './config.ts';

createApp().listen(config.port, config.host, () => {
  console.log(`API ready: http://${config.host}:${config.port}`);
});
