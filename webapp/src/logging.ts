export const LOG_PREFIX = "[DEMETER]";

// Define the log levels as a tuple, ensuring type safety
const levels = ["error", "debug", "warn"] as const;
type Level = typeof levels[number]; // Type for allowed log levels
type LogFn = (...args: unknown[]) => void; // Type for a log function
type Logger = {
    [K in Level]: LogFn; // Logger object type mapping levels to log functions
};

// Factory function to create a log function for a specific level
function createLogFunction(level: Level): LogFn {
    return (...args: unknown[]) => {
        console[level](LOG_PREFIX, ...args); // Use the console method corresponding to the log level
    };
}

// Create the logger object by reducing over the levels array
export const log: Logger = levels.reduce((acc, level) => {
    acc[level] = createLogFunction(level); // Assign a log function for each level
    return acc;
}, {} as Logger); // Assert the initial value as Logger type