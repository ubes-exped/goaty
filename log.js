import { createSimpleLogger } from 'simple-node-logger';

const log = createSimpleLogger({
  timestampFormat: 'YYYY-MM-DD HH:mm:ss'
});
export default log;
