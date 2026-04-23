# Deployment Guide

## Overview
This guide covers deploying the Real-Time Chat API to production environments.

## Table of Contents
1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Pre-deployment Checklist

### Security
- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable helmet security headers
- [ ] Review and update .env variables
- [ ] Remove development dependencies

### Performance
- [ ] Enable production mode
- [ ] Configure caching (Redis)
- [ ] Set up database indexes
- [ ] Configure connection pooling
- [ ] Enable compression
- [ ] Optimize Docker images

### Monitoring
- [ ] Set up logging
- [ ] Configure error tracking
- [ ] Set up health checks
- [ ] Configure alerts
- [ ] Set up performance monitoring

---

## Environment Setup

### Production Environment Variables

Create `.env.production`:

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_strong_password
DB_DATABASE=chat_api_prod

# Redis
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_very_long_and_secure_refresh_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Production SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads

# Logging
LOG_LEVEL=info
```

### Security Best Practices

1. **Never commit .env files**
2. **Use environment-specific configs**
3. **Rotate secrets regularly**
4. **Use secret management services** (AWS Secrets Manager, Azure Key Vault)

---

## Database Setup

### PostgreSQL Production Setup

#### 1. Create Production Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE chat_api_prod;

-- Create user with strong password
CREATE USER chat_api_user WITH ENCRYPTED PASSWORD 'your_strong_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chat_api_prod TO chat_api_user;

-- Connect to database
\c chat_api_prod

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO chat_api_user;
```

#### 2. Run Migrations

```bash
# Generate migration
npm run migration:generate -- -n InitialSchema

# Run migrations
npm run migration:run

# Verify migrations
npm run migration:show
```

#### 3. Database Backup

```bash
# Backup database
pg_dump -U chat_api_user -h localhost chat_api_prod > backup_$(date +%Y%m%d).sql

# Restore database
psql -U chat_api_user -h localhost chat_api_prod < backup_20260423.sql
```

### Redis Production Setup

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password
requirepass your_redis_password

# Bind to specific IP
bind 127.0.0.1

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis
```

---

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)
- Full control over server
- Manual configuration required
- Cost-effective for medium traffic

### Option 2: Platform as a Service (Heroku, Railway, Render)
- Easy deployment
- Automatic scaling
- Higher cost per resource

### Option 3: Container Orchestration (Kubernetes, Docker Swarm)
- Best for large scale
- Complex setup
- Excellent scalability

### Option 4: Serverless (AWS Lambda, Google Cloud Functions)
- Pay per use
- Auto-scaling
- Limited for WebSocket (use AWS API Gateway WebSocket)

---

## Docker Deployment

### Production Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY src ./src

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network
    volumes:
      - ./uploads:/app/uploads

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Deploy with Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update application
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Cloud Deployment

### AWS Deployment

#### Using AWS ECS (Elastic Container Service)

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name chat-api
```

2. **Build and Push Docker Image**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t chat-api .

# Tag image
docker tag chat-api:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chat-api:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chat-api:latest
```

3. **Create ECS Task Definition**
```json
{
  "family": "chat-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "chat-api",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chat-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/chat-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Using AWS RDS for PostgreSQL

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier chat-api-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123 \
  --allocated-storage 20
```

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-chat-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run migration:run

# View logs
heroku logs --tail
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: chat-api
services:
  - name: api
    github:
      repo: your-username/chat-api
      branch: main
    build_command: npm run build
    run_command: npm run start:prod
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
    routes:
      - path: /
databases:
  - name: postgres
    engine: PG
    version: "15"
  - name: redis
    engine: REDIS
    version: "7"
```

---

## SSL/TLS Configuration

### Nginx Configuration with SSL

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream api {
        server app:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # API proxy
        location /api {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket proxy
        location /socket.io {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
        }
    }
}
```

### Let's Encrypt SSL Certificate

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Application Logging

```typescript
// src/common/logger/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.simple(),
      }));
    }
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace: string) {
    this.logger.error(message, { trace });
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }
}
```

### Health Check Endpoint

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

### Monitoring Tools

1. **PM2 for Process Management**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name chat-api

# Monitor
pm2 monit

# Logs
pm2 logs chat-api

# Auto-restart on file changes
pm2 start dist/main.js --watch

# Startup script
pm2 startup
pm2 save
```

2. **Prometheus + Grafana**
```typescript
// Install metrics
npm install @willsoto/nestjs-prometheus prom-client

// Configure in app.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register(),
  ],
})
```

---

## Backup & Recovery

### Automated Database Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="chat_api_prod"

# Create backup
pg_dump -U chat_api_user $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-bucket/backups/
```

### Cron Job for Automated Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database is running
docker ps | grep postgres

# Check connection
psql -U chat_api_user -h localhost -d chat_api_prod

# Check environment variables
echo $DB_HOST
```

#### 2. Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping

# Test with password
redis-cli -a your_password ping
```

#### 3. WebSocket Connection Issues
- Check CORS configuration
- Verify SSL/TLS for wss://
- Check firewall rules
- Verify proxy configuration

#### 4. High Memory Usage
```bash
# Check memory usage
docker stats

# Restart container
docker-compose restart app
```

### Debugging Production Issues

```bash
# View application logs
docker-compose logs -f app

# Enter container
docker exec -it container_name sh

# Check environment variables
docker exec container_name env

# Database queries
docker exec -it postgres_container psql -U user -d database
```

---

## Performance Optimization

### 1. Enable Compression
```typescript
// main.ts
import * as compression from 'compression';
app.use(compression());
```

### 2. Connection Pooling
```typescript
// database.config.ts
extra: {
  max: 20,
  min: 5,
  idle: 10000,
}
```

### 3. Caching Strategy
- Cache frequently accessed data
- Use Redis for session storage
- Implement CDN for static assets

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Real-Time Chat API to production. Choose the deployment option that best fits your needs and scale.

**Key Takeaways:**
- Always use HTTPS in production
- Implement proper monitoring and logging
- Set up automated backups
- Use environment variables for configuration
- Follow security best practices

**Next Steps:**
- Set up CI/CD pipeline
- Configure monitoring alerts
- Implement load balancing for high traffic
- Set up disaster recovery plan

---

**Status:** Deployment guide complete
**Last Updated:** 2026-04-23