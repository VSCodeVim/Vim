import * as TransportStream from 'winston-transport';
import * as winston from 'winston';
import { ConsoleForElectron } from 'winston-console-for-electron';
import { Message } from './message';
import { configuration } from '../configuration/configuration';

class ErrorMessageTransportStream extends TransportStream {
  public log(info: { level: string; message: string }, callback: Function) {
    if (info.level === 'error') {
      Message.ShowError(info.message);
    }

    if (callback) {
      callback();
    }
  }
}

export namespace log {
  export function onConfigurationChange() {
    logger.remove(new ErrorMessageTransportStream());
    if (configuration.debug.displayError) {
      logger.add(new ErrorMessageTransportStream());
    }
  }
}

const logger = winston.createLogger({
  level: configuration.debug.loggingLevel,
  format: winston.format.simple(),
  transports: [new ConsoleForElectron()],
});

if (configuration.debug.displayError) {
  logger.add(new ErrorMessageTransportStream());
}

export { logger };
