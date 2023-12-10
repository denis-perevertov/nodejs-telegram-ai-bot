import * as winston from 'winston';

export let logger = null;

const { format, createLogger, transports } = winston.default;
const { timestamp: timestamp, combine: combine, errors: errors, json: json, printf: printf } = format;

function buildDevLogger() {
    const logFormat = printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} ${level}: ${stack || message}`;
    });

    return createLogger({
        format: combine(
            format.colorize(),
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: true }),
            logFormat
        ),
        transports: [new transports.Console()],
    });
}

function buildProdLogger() {
    return createLogger({
        format: combine(timestamp(), errors({ stack: true }), json()),
        defaultMeta: { service: "tasks-backend" },
        transports: [new transports.Console()],
    });
}

if (process.env.NODE_ENV == "development") {
    logger = buildDevLogger();
    logger.info("Logging in development mode", { env: "Development" });
} else {
    logger = buildProdLogger();
    logger.info("Logging in production mode");
}