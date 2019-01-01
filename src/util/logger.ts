import * as winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron';
import { configuration } from '../configuration/configuration';

export const logger = winston.createLogger({
  level: configuration.debug.loggingLevel,
  format: winston.format.simple(),
  transports: [new ConsoleForElectron()],
});
