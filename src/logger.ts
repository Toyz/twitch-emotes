import colors from "colors";
import { createLogger, format, transports } from "winston";

const getColorizedLevel = (level: string): string => {
  const levelText = level.toUpperCase();
  switch (level) {
    case "info":
      return `[${colors.green(levelText)}]`;
    case "warn":
      return `[${colors.yellow(levelText)}]`;
    case "error":
      return `[${colors.red(levelText)}]`;
    case "debug":
      return `[${colors.blue(levelText)}]`;
    default:
      return `[${levelText}]`;
  }
};

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: format.combine(
    format.timestamp({ format: "HH:mm:ss" }),
    format.printf(({ level, message, timestamp }) => {
      const coloredLevel = getColorizedLevel(level);
      const coloredTimestamp = colors.gray(timestamp);
      return `${coloredLevel} ${coloredTimestamp} - ${message}`;
    })
  ),
  transports: [new transports.Console()],
});

export { logger };
