import pino from 'pino';

const base = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
        process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
});

export function createLogger(module: string) {
    return base.child({ module });
}

export default base;
