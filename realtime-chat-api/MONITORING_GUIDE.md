# Monitoring & Logging Guide

## Overview
Comprehensive guide for monitoring, logging, and observability of the Real-Time Chat API in production.

## Table of Contents
1. [Logging Strategy](#logging-strategy)
2. [Application Monitoring](#application-monitoring)
3. [Infrastructure Monitoring](#infrastructure-monitoring)
4. [Error Tracking](#error-tracking)
5. [Performance Monitoring](#performance-monitoring)
6. [Alerting](#alerting)
7. [Health Checks](#health-checks)
8. [Metrics Collection](#metrics-collection)

---

## Logging Strategy

### Winston Logger Setup

#### Install Dependencies
```bash
npm install winston winston-daily-rotate-file
```

#### Logger Service

```typescript
// src/common/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    );

    // Console transport for development
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, trace }) => {
          return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
        })
      ),
    });

    // File transport for errors
    const errorFileTransport = new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    });

    // File transport for all logs
    const combinedFileTransport = new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        errorFileTransport,
        combinedFileTransport,
      ],
    });

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(consoleTransport);
    }
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

#### Logger Module

```typescript
// src/common/logger/logger.module.ts
import { Module, Global } from '@nestjs/common';
import { CustomLogger } from './logger.service';

@Global()
@Module({
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule {}
```

#### Usage in Services

```typescript
import { Injectable } from '@nestjs/common';
import { CustomLogger } from '../common/logger/logger.service';

@Injectable()
export class MessagesService {
  constructor(private readonly logger: CustomLogger) {}

  async sendMessage(data: any) {
    this.logger.log('Sending message', 'MessagesService');
    
    try {
      // Business logic
      this.logger.log(`Message sent: ${data.id}`, 'MessagesService');
    } catch (error) {
      this.logger.error(
        `Failed to send message: ${error.message}`,
        error.stack,
        'MessagesService'
      );
      throw error;
    }
  }
}
```

### Structured Logging

```typescript
// Log with metadata
this.logger.log('User logged in', {
  context: 'AuthService',
  userId: user.id,
  username: user.username,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});

// Log with correlation ID
this.logger.log('Processing request', {
  context: 'MessagesController',
  correlationId: request.headers['x-correlation-id'],
  method: request.method,
  url: request.url,
});
```

---

## Application Monitoring

### Prometheus Integration

#### Install Dependencies
```bash
npm install @willsoto/nestjs-prometheus prom-client
```

#### Configure Prometheus Module

```typescript
// src/app.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

#### Custom Metrics

```typescript
// src/common/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter,
    
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram,
    
    @InjectMetric('websocket_connections')
    private readonly websocketConnections: Gauge,
  ) {}

  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsCounter.inc({ method, route, status_code: statusCode });
  }

  recordHttpDuration(method: string, route: string, duration: number) {
    this.httpRequestDuration.observe({ method, route }, duration);
  }

  setWebSocketConnections(count: number) {
    this.websocketConnections.set(count);
  }
}
```

#### Metrics Interceptor

```typescript
// src/common/interceptors/metrics.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = (Date.now() - startTime) / 1000;

        this.metricsService.incrementHttpRequests(
          request.method,
          request.route.path,
          response.statusCode,
        );

        this.metricsService.recordHttpDuration(
          request.method,
          request.route.path,
          duration,
        );
      }),
    );
  }
}
```

### Grafana Dashboard

#### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'chat-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

#### Docker Compose for Monitoring Stack

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

#### Key Metrics to Monitor

1. **HTTP Metrics**
   - Request rate (requests/second)
   - Response time (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - Request duration histogram

2. **WebSocket Metrics**
   - Active connections
   - Messages sent/received per second
   - Connection errors
   - Average message latency

3. **Database Metrics**
   - Query execution time
   - Connection pool usage
   - Slow queries count
   - Transaction rate

4. **Application Metrics**
   - Memory usage
   - CPU usage
   - Event loop lag
   - Garbage collection time

---

## Infrastructure Monitoring

### System Metrics

#### Node Exporter (for system metrics)

```yaml
# docker-compose.monitoring.yml (add to services)
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
```

### Database Monitoring

#### PostgreSQL Exporter

```yaml
# docker-compose.monitoring.yml (add to services)
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://user:password@postgres:5432/database?sslmode=disable"
    depends_on:
      - postgres
```

### Redis Monitoring

#### Redis Exporter

```yaml
# docker-compose.monitoring.yml (add to services)
  redis-exporter:
    image: oliver006/redis_exporter:latest
    ports:
      - "9121:9121"
    environment:
      REDIS_ADDR: "redis:6379"
    depends_on:
      - redis
```

---

## Error Tracking

### Sentry Integration

#### Install Sentry

```bash
npm install @sentry/node @sentry/tracing
```

#### Configure Sentry

```typescript
// src/main.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    integrations: [
      new ProfilingIntegration(),
    ],
  });

  const app = await NestFactory.create(AppModule);
  
  // ... rest of bootstrap
}
```

#### Sentry Error Filter

```typescript
// src/common/filters/sentry-exception.filter.ts
import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Log to Sentry
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      
      // Only log server errors (5xx)
      if (status >= 500) {
        Sentry.captureException(exception);
      }
    } else {
      Sentry.captureException(exception);
    }

    // Call parent filter
    super.catch(exception, host);
  }
}
```

#### Usage

```typescript
// src/main.ts
app.useGlobalFilters(new SentryExceptionFilter());
```

---

## Performance Monitoring

### APM (Application Performance Monitoring)

#### New Relic Integration

```bash
npm install newrelic
```

```javascript
// newrelic.js
'use strict'

exports.config = {
  app_name: ['Real-Time Chat API'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
```

```typescript
// src/main.ts
require('newrelic'); // Must be first line

async function bootstrap() {
  // ... rest of bootstrap
}
```

### Custom Performance Tracking

```typescript
// src/common/decorators/track-performance.decorator.ts
import { CustomLogger } from '../logger/logger.service';

export function TrackPerformance() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const logger = new CustomLogger();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;

        logger.log(
          `${propertyKey} completed in ${duration}ms`,
          target.constructor.name
        );

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(
          `${propertyKey} failed after ${duration}ms: ${error.message}`,
          error.stack,
          target.constructor.name
        );
        throw error;
      }
    };

    return descriptor;
  };
}
```

#### Usage

```typescript
@Injectable()
export class MessagesService {
  @TrackPerformance()
  async sendMessage(data: CreateMessageDto) {
    // Method implementation
  }
}
```

---

## Alerting

### Alert Rules (Prometheus)

```yaml
# alerts.yml
groups:
  - name: chat_api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      # Database connection pool exhausted
      - alert: DatabasePoolExhausted
        expr: database_pool_active_connections / database_pool_max_connections > 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "Pool usage is at {{ $value }}%"

      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 1024
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}MB"

      # WebSocket connection spike
      - alert: WebSocketConnectionSpike
        expr: rate(websocket_connections[5m]) > 100
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "WebSocket connection spike detected"
          description: "Connection rate is {{ $value }} connections/sec"
```

### Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical'
    - match:
        severity: warning
      receiver: 'warning'

receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://localhost:5001/webhook'

  - name: 'critical'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts-critical'
        title: 'Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'

  - name: 'warning'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts-warning'
        title: 'Warning Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
```

---

## Health Checks

### Health Check Module

```typescript
// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

### Health Check Controller

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../modules/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database check
      () => this.db.pingCheck('database'),
      
      // Memory check (heap should not exceed 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // Memory check (RSS should not exceed 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      
      // Disk check (should have at least 50% free space)
      () => this.disk.checkStorage('storage', {
        path: '/',
        thresholdPercent: 0.5,
      }),
    ]);
  }

  @Get('ready')
  @Public()
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('live')
  @Public()
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

---

## Metrics Collection

### Key Metrics to Track

#### Business Metrics
- Total users
- Active users (daily, weekly, monthly)
- Messages sent per day
- Conversations created
- Average messages per conversation
- User retention rate

#### Technical Metrics
- API response time (p50, p95, p99)
- Error rate by endpoint
- WebSocket connection count
- Database query performance
- Cache hit/miss ratio
- Memory usage
- CPU usage

### Custom Business Metrics

```typescript
// src/common/metrics/business-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class BusinessMetricsService {
  constructor(
    @InjectMetric('total_users')
    private readonly totalUsers: Gauge,
    
    @InjectMetric('messages_sent_total')
    private readonly messagesSent: Counter,
    
    @InjectMetric('conversations_created_total')
    private readonly conversationsCreated: Counter,
  ) {}

  updateTotalUsers(count: number) {
    this.totalUsers.set(count);
  }

  incrementMessagesSent() {
    this.messagesSent.inc();
  }

  incrementConversationsCreated() {
    this.conversationsCreated.inc();
  }
}
```

---

## Best Practices

### 1. Log Levels
- **ERROR**: System errors, exceptions
- **WARN**: Potential issues, deprecated features
- **INFO**: Important business events
- **DEBUG**: Detailed debugging information
- **VERBOSE**: Very detailed information

### 2. Structured Logging
Always include:
- Timestamp
- Log level
- Context/service name
- Correlation ID
- User ID (if applicable)
- Request ID

### 3. Monitoring Checklist
- [ ] Application logs centralized
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Health checks implemented
- [ ] Alerts configured
- [ ] Dashboards created
- [ ] On-call rotation established

### 4. Alert Fatigue Prevention
- Set appropriate thresholds
- Use alert grouping
- Implement alert suppression
- Regular alert review and tuning

---

## Conclusion

Proper monitoring and logging are essential for maintaining a healthy production system. This guide provides the foundation for observability in the Real-Time Chat API.

**Key Takeaways:**
- Implement structured logging
- Monitor key metrics
- Set up alerting
- Track errors with Sentry
- Use health checks
- Create dashboards for visualization

---

**Last Updated:** 2026-04-23
**Status:** Production Ready