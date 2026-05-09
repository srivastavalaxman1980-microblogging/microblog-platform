const client = require('prom-client');
const express = require('express');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500]
});

const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of active users'
});

const postsCreated = new client.Counter({
  name: 'posts_created_total',
  help: 'Total number of posts created'
});

const notificationsSent = new client.Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent'
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(activeUsers);
register.registerMetric(postsCreated);
register.registerMetric(notificationsSent);

// Middleware to track request duration
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
};

module.exports = {
  register,
  metricsMiddleware,
  metrics: {
    activeUsers,
    postsCreated,
    notificationsSent
  }
};