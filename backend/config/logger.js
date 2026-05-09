const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [new winston.transports.Console()];

// Add Elasticsearch transport if configured
if (process.env.ELASTICSEARCH_HOST) {
  const esTransport = new ElasticsearchTransport({
    level: 'info',
    clientOpts: { node: process.env.ELASTICSEARCH_HOST },
    index: 'microblogging-logs',
    transformer: (logData) => ({
      '@timestamp': logData.timestamp,
      severity: logData.level,
      message: logData.message,
      ...logData.meta
    })
  });
  transports.push(esTransport);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports
});

module.exports = logger;