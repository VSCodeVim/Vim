import { configuration } from '../configuration/configuration';
import * as winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron';

const logger = winston.createLogger({
  level: configuration.debug.loggingLevel,
  format: winston.format.simple(),
  transports: [new ConsoleForElectron()],
});

export default logger;
