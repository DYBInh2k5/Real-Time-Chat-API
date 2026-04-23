# Performance Optimization Guide

## Overview
This guide provides recommendations and best practices for optimizing the Real-Time Chat API performance.

## Current Optimizations

### 1. Database Indexes ✅

All entities have been optimized with appropriate indexes:

#### Users Table
```sql
- PRIMARY KEY (id)
- UNIQUE INDEX (email)
- UNIQUE INDEX (username)
- INDEX (status)
- INDEX (lastLoginAt)
```

#### Messages Table
```sql
- PRIMARY KEY (id)
- INDEX (senderId, createdAt)
- INDEX (receiverId, createdAt)
- INDEX (conversationId, createdAt)
- INDEX (senderId)
- INDEX (receiverId)
- INDEX (conversationId)
```

#### Conversations Table
```sql
- PRIMARY KEY (id)
- INDEX (type, createdAt)
- INDEX (createdBy)
```

#### ConversationMembers Table
```sql
- PRIMARY KEY (id)
- UNIQUE INDEX (conversationId, userId)
- INDEX (conversationId, userId)
- INDEX (userId, joinedAt)
- INDEX (conversationId)
- INDEX (userId)
```

#### MessageReactions Table
```sql
- PRIMARY KEY (id)
- UNIQUE INDEX (messageId, userId, emoji)
- INDEX (messageId, emoji)
- INDEX (userId, createdAt)
- INDEX (messageId)
- INDEX (userId)
```

#### UserBlocks Table
```sql
- PRIMARY KEY (id)
- UNIQUE INDEX (blockerId, blockedId)
- INDEX (blockerId, createdAt)
- INDEX (blockedId, createdAt)
- INDEX (blockerId)
- INDEX (blockedId)
```

### 2. Query Optimization ✅

**Pagination:**
- All list endpoints support pagination
- Default limit: 20-50 items per page
- Prevents loading large datasets

**Selective Loading:**
- Relations loaded only when needed
- Use of `relations` parameter in TypeORM
- Avoid N+1 query problems

**Efficient Queries:**
- Use of query builder for complex queries
- Proper use of WHERE clauses
- Index-backed sorting

### 3. Rate Limiting ✅

**Current Configuration:**
```typescript
ThrottlerModule.forRootAsync({
  useFactory: (configService: ConfigService) => [
    {
      ttl: parseInt(configService.get('THROTTLE_TTL') || '60', 10) * 1000,
      limit: parseInt(configService.get('THROTTLE_LIMIT') || '10', 10),
    },
  ],
})
```

**Default Settings:**
- TTL: 60 seconds
- Limit: 10 requests per TTL
- Applied globally to all endpoints

**Recommended Settings by Endpoint Type:**
```
Authentication endpoints: 5 requests/minute
Message sending: 30 requests/minute
User search: 20 requests/minute
File upload: 5 requests/minute
General API: 100 requests/minute
```

## Recommended Optimizations

### 1. Redis Caching

**Install Dependencies:**
```bash
npm install @nestjs/cache-manager cache-manager
npm install cache-manager-redis-store
npm install @types/cache-manager --save-dev
```

**Cache Strategy:**

**User Data (TTL: 5 minutes):**
```typescript
// Cache user profile
const user = await cacheService.getOrSet(
  `user:${userId}`,
  () => usersService.findOne(userId),
  300 // 5 minutes
);
```

**Conversations (TTL: 10 minutes):**
```typescript
// Cache conversation list
const conversations = await cacheService.getOrSet(
  `conversations:user:${userId}:page:${page}`,
  () => conversationsService.findAllForUser(userId, page),
  600 // 10 minutes
);
```

**Messages (TTL: 2 minutes):**
```typescript
// Cache message history
const messages = await cacheService.getOrSet(
  `messages:${conversationId}:page:${page}`,
  () => messagesService.findConversationMessages(conversationId, page),
  120 // 2 minutes
);
```

**Online Users (TTL: 30 seconds):**
```typescript
// Cache online users list
const onlineUsers = await cacheService.getOrSet(
  'users:online',
  () => usersService.getOnlineUsers(),
  30 // 30 seconds
);
```

**Cache Invalidation:**
```typescript
// Invalidate on update
await cacheService.invalidateUser(userId);
await cacheService.invalidateConversation(conversationId);
await cacheService.invalidateMessages(conversationId);
```

### 2. Connection Pooling

**PostgreSQL Configuration:**
```typescript
// database.config.ts
export default registerAs('database', () => ({
  type: 'postgres',
  // ... other config
  extra: {
    max: 20, // Maximum pool size
    min: 5,  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
}));
```

### 3. Query Optimization Tips

**Use Select Specific Fields:**
```typescript
// Instead of loading all fields
const users = await userRepository.find({
  select: ['id', 'username', 'avatar'], // Only needed fields
});
```

**Use Query Builder for Complex Queries:**
```typescript
const messages = await messageRepository
  .createQueryBuilder('message')
  .select(['message.id', 'message.content', 'message.createdAt'])
  .leftJoin('message.sender', 'sender')
  .addSelect(['sender.id', 'sender.username'])
  .where('message.conversationId = :id', { id: conversationId })
  .orderBy('message.createdAt', 'DESC')
  .take(50)
  .getMany();
```

**Avoid N+1 Queries:**
```typescript
// Bad: N+1 queries
const conversations = await conversationRepository.find();
for (const conv of conversations) {
  conv.members = await memberRepository.find({ conversationId: conv.id });
}

// Good: Single query with relations
const conversations = await conversationRepository.find({
  relations: ['members', 'members.user'],
});
```

### 4. WebSocket Optimization

**Connection Management:**
```typescript
// Limit connections per user
const MAX_CONNECTIONS_PER_USER = 5;

// Disconnect old connections if limit exceeded
if (userConnections.size >= MAX_CONNECTIONS_PER_USER) {
  const oldestConnection = userConnections.values().next().value;
  oldestConnection.disconnect();
}
```

**Message Batching:**
```typescript
// Batch multiple messages
const messageBatch = [];
socket.on('message:send', (data) => {
  messageBatch.push(data);
  
  if (messageBatch.length >= 10) {
    processBatch(messageBatch);
    messageBatch.length = 0;
  }
});
```

**Room Optimization:**
```typescript
// Use specific rooms instead of broadcasting to all
socket.to(`conversation:${conversationId}`).emit('message:new', message);
// Instead of: io.emit('message:new', message);
```

### 5. Database Optimization

**Bulk Operations:**
```typescript
// Instead of multiple inserts
for (const member of members) {
  await memberRepository.save(member);
}

// Use bulk insert
await memberRepository.save(members);
```

**Soft Delete Instead of Hard Delete:**
```typescript
// Already implemented in entities
message.isDeleted = true;
message.deletedAt = new Date();
await messageRepository.save(message);
```

**Use Transactions for Multiple Operations:**
```typescript
await dataSource.transaction(async (manager) => {
  await manager.save(conversation);
  await manager.save(members);
  await manager.save(message);
});
```

### 6. API Response Optimization

**Compression:**
```bash
npm install compression
```

```typescript
// main.ts
import * as compression from 'compression';
app.use(compression());
```

**Response Caching Headers:**
```typescript
@Header('Cache-Control', 'public, max-age=300')
@Get('users/:id')
async getUser(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

### 7. Monitoring & Profiling

**Add Logging:**
```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('PerformanceMonitor');

// Log slow queries
const start = Date.now();
const result = await query();
const duration = Date.now() - start;

if (duration > 1000) {
  logger.warn(`Slow query detected: ${duration}ms`);
}
```

**Health Checks:**
```typescript
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    database: await this.checkDatabase(),
    redis: await this.checkRedis(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };
}
```

## Performance Benchmarks

### Target Metrics

**API Response Times:**
- Authentication: < 200ms
- User queries: < 100ms
- Message queries: < 150ms
- Conversation queries: < 200ms
- WebSocket latency: < 50ms

**Throughput:**
- API requests: 1000 req/sec
- WebSocket messages: 5000 msg/sec
- Concurrent connections: 10,000+

**Database:**
- Query time: < 50ms (95th percentile)
- Connection pool: 80% utilization max
- Index hit rate: > 95%

## Load Testing

**Tools:**
- Apache Bench (ab)
- Artillery
- k6
- JMeter

**Example Artillery Test:**
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load
scenarios:
  - name: 'API Load Test'
    flow:
      - post:
          url: '/api/auth/login'
          json:
            username: 'testuser'
            password: 'password'
      - get:
          url: '/api/messages'
      - get:
          url: '/api/conversations'
```

## Best Practices Summary

✅ **Use database indexes** on frequently queried fields
✅ **Implement caching** for frequently accessed data
✅ **Use pagination** for all list endpoints
✅ **Optimize queries** with query builder and selective loading
✅ **Use connection pooling** for database connections
✅ **Implement rate limiting** to prevent abuse
✅ **Use compression** for API responses
✅ **Monitor performance** with logging and health checks
✅ **Use transactions** for multiple related operations
✅ **Batch operations** when possible
✅ **Use soft deletes** instead of hard deletes
✅ **Optimize WebSocket** with rooms and batching

## Conclusion

The current implementation already includes many performance optimizations:
- Database indexes on all entities
- Pagination on all list endpoints
- Rate limiting configured
- Efficient query patterns
- WebSocket room-based messaging

For production deployment, consider implementing:
- Redis caching layer
- Connection pooling configuration
- Monitoring and alerting
- Load testing
- CDN for static assets
- Database read replicas for scaling

---

**Status:** Performance optimizations documented and recommended
**Next Steps:** Implement caching layer and monitoring for production