import * as winston from 'winston';

const { combine, timestamp: winstonTimestamp, printf, colorize, errors } = winston.format;

const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    errors({ stack: true }),
    winstonTimestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    printf(({ level, message, timestamp, context, stack }) => {
      const safeMessage = typeof message === 'string' ? message : JSON.stringify(message);

      const safeContext = typeof context === 'string' ? `[${context}]` : '';

      const safeStack = stack ? `\n${stack as string}` : '';

      const safeTimestamp = typeof timestamp === 'string' ? timestamp : String(timestamp);

      return `${safeTimestamp} [${level}] ${safeContext} ${safeMessage}${safeStack}`;
    }),
  ),
});

const transports: winston.transport[] = [consoleTransport];

export const winstonConfig = {
  transports,
};
