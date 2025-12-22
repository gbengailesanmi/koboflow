import logger, { stdTimeFunctions } from 'pino'

const level = process.env.LOG_LEVEL || 'info'

// Set 'level' in each log to be the string level name instead of integer level (e.g. print "ERROR" instead of 50 as the level for error logs)
// Set 'time' in each log to be the ISO time format
// Needed for Elasticsearch indexing in Bosun as other apps are logging 'level' as strings so any logs with 'level' that aren't strings won't appear
export default logger({
  formatters: {
    level: (label) => {
      return {
        level: label.toUpperCase()
      }
    }
  },
  timestamp: stdTimeFunctions.isoTime,
  level
})
