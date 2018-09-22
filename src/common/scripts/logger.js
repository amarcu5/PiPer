import { LOGGING_LEVEL } from './defines.js'

const loggingPrefix = '[PiPer] ';

/** @enum {number} - Enum for logging level */
export const LoggingLevel = {
  ALL: 0,
  TRACE: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40,
};

/**
 * Logs stack trace to console
 */
export const trace = (LoggingLevel.TRACE >= LOGGING_LEVEL) ? 
    console.trace.bind(console) : function(){};

/**
 * Logs informational message to console
 */
export const info = (LoggingLevel.INFO >= LOGGING_LEVEL) ? 
    console.info.bind(console, loggingPrefix) : function(){};
    
/**
 * Logs warning message to console
 */
export const warn = (LoggingLevel.WARNING >= LOGGING_LEVEL) ? 
    console.warn.bind(console, loggingPrefix) : function(){};
    
/**
 * Logs error message to console
 */
export const error = (LoggingLevel.ERROR >= LOGGING_LEVEL) ? 
    console.error.bind(console, loggingPrefix) : function(){};