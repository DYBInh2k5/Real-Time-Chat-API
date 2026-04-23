# 🏗️ System Architecture - Real-Time Chat API

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web App, Mobile App, Desktop App)                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP/REST + WebSocket
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  - CORS, Rate Limiting, Authentication                          │
│  - Request Validation, Error Handling                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  REST API    │  │  WebSocket    │
│  (NestJS)    │  │  (Socket.io)  │
└───────┬──────┘  └──────┬────────┘
        │                 │
        └────────┬────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Auth   │  │  Users   │  │   Chat   │  │  Rooms   │       │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  PostgreSQL  │  │     Redis     │
│  (Primary    │  │  (Cache +     │
│   Database)  │  │   Pub/Sub)    │
└──────────────┘  └───────────────┘
```

## 🔄 Request Flow

### REST API Request Flow
```
1. Client → API Gateway (CORS, Rate Limit Check)
2. API Gateway → Auth Guard (JWT Validation)
3. Auth Guard → Controller (Route Handler)
4. Controller → Service (Business Logic)
5. Service → Repository (Database Access)
6. Repository → PostgreSQL (Data Storage)
7. Response ← Service ← Repository ← PostgreSQL
8. Response → Client
```

### WebSocket Connection Flow
```
1. Client → WebSocket Server (Socket.io)
2. WebSocket → Auth Middleware (JWT Validation)
3. Auth Success → Join User to Rooms
4. Client Emit Event → Event Handler
5. Event Handler → Service (Business Logic)
6. Service → Redis Pub/Sub (Broadcast)
7. Redis → All Connected Servers
8. Server → Emit to Connected Clients
```

## 📦 Module Structure

### 1. Auth Module
**Responsibility**: Authentication & Authorization

```typescript
auth/
├── auth.controller.ts      // REST endpoints
├── auth.service.ts         // Business logic
├── auth.module.ts          // Module definition
├── strategies/
│   ├── jwt.strategy.ts     // JWT validation
│   └── local.strategy.ts   // Username/password
├── guards/
│   ├── jwt-auth.guard.ts   // JWT guard
│   └── roles.guard.ts      // Role-based access
└── dto/
    ├── login.dto.ts
    ├── register.dto.ts
    └── refresh-token.dto.ts
```

**Key Features**:
- User registration with email verification
- Login with JWT token generation
- Refresh token mechanism
- Password reset flow
- Role-based access control

### 2. Users Module
**Responsibility**: User Management

```typescript
users/
├── users.controller.ts     // REST endpoints
├── users.service.ts        // Business logic
├── users.module.ts         // Module definition
├── entities/
│   └── user.entity.ts      // TypeORM entity
└── dto/
    ├── create-user.dto.ts
    ├── update-user.dto.ts
    └── user-response.dto.ts
```

**Key Features**:
- User profile CRUD
- Avatar upload
- User search
- Online status management
- User preferences

### 3. Chat Module
**Responsibility**: Real-time Messaging

```typescript
chat/
├── chat.gateway.ts         // WebSocket gateway
├── chat.service.ts         // Business logic
├── chat.module.ts          // Module definition
├── entities/
│   ├── message.entity.ts
│   └── message-read.entity.ts
└── dto/
    ├── send-message.dto.ts
    └── message-response.dto.ts
```

**Key Features**:
- Real-time message sending/receiving
- Typing indicators
- Read receipts
- Message editing/deletion
- Message reactions
- File attachments

### 4. Rooms Module
**Responsibility**: Channel & Room Management

```typescript
rooms/
├── rooms.controller.ts     // REST endpoints
├── rooms.service.ts        // Business logic
├── rooms.module.ts         // Module definition
├── entities/
│   ├── room.entity.ts
│   └── room-member.entity.ts
└── dto/
    ├── create-room.dto.ts
    └── update-room.dto.ts
```

**Key Features**:
- Create/manage channels
- Public/private rooms
- Direct messages
- Group chats
- Member management
- Room permissions

## 🗄️ Database Schema

### Core Entities

#### Users Table
```sql
users (
  id              UUID PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  username        VARCHAR(50) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  avatar_url      VARCHAR(500),
  status          ENUM('online', 'offline', 'away'),
  last_seen_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)
```

#### Rooms Table
```sql
rooms (
  id              UUID PRIMARY KEY,
  type            ENUM('direct', 'group', 'channel'),
  name            VARCHAR(100),
  description     TEXT,
  avatar_url      VARCHAR(500),
  is_private      BOOLEAN DEFAULT false,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)
```

#### Messages Table
```sql
messages (
  id              UUID PRIMARY KEY,
  room_id         UUID REFERENCES rooms(id),
  user_id         UUID REFERENCES users(id),
  content         TEXT NOT NULL,
  type            ENUM('text', 'image', 'file', 'system'),
  file_url        VARCHAR(500),
  reply_to_id     UUID REFERENCES messages(id),
  edited_at       TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
)
```

#### Room Members Table
```sql
room_members (
  room_id         UUID REFERENCES rooms(id),
  user_id         UUID REFERENCES users(id),
  role            ENUM('owner', 'admin', 'member'),
  joined_at       TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
)
```

#### Message Reads Table
```sql
message_reads (
  message_id      UUID REFERENCES messages(id),
  user_id         UUID REFERENCES users(id),
  read_at         TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
)
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_users_status ON users(status);
```

## 🔴 Redis Data Structures

### 1. User Sessions
```
Key: session:{userId}
Type: Hash
TTL: 7 days
Data: {
  accessToken: string,
  refreshToken: string,
  deviceInfo: string,
  lastActivity: timestamp
}
```

### 2. User Presence
```
Key: presence:{userId}
Type: String
TTL: 5 minutes (auto-refresh)
Data: "online" | "away" | "offline"
```

### 3. Typing Indicators
```
Key: typing:{roomId}
Type: Set
TTL: 5 seconds
Data: [userId1, userId2, ...]
```

### 4. Unread Message Count
```
Key: unread:{userId}:{roomId}
Type: Integer
Data: count
```

### 5. Pub/Sub Channels
```
Channel: room:{roomId}
Purpose: Broadcast messages to room members

Channel: user:{userId}
Purpose: Send notifications to specific user
```

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login
   ↓
2. Validate Credentials (bcrypt)
   ↓
3. Generate JWT Access Token (15 min expiry)
   ↓
4. Generate Refresh Token (7 days expiry)
   ↓
5. Store Refresh Token in Redis
   ↓
6. Return Tokens to Client
```

### Authorization Layers
```
1. JWT Guard (All Protected Routes)
   ↓
2. Role Guard (Admin/Moderator Routes)
   ↓
3. Resource Owner Guard (User-specific Resources)
   ↓
4. Room Member Guard (Room-specific Actions)
```

### Security Measures
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT with short expiration
- ✅ Refresh token rotation
- ✅ Rate limiting (10 req/min per IP)
- ✅ Input validation (class-validator)
- ✅ SQL injection prevention (TypeORM)
- ✅ XSS protection (sanitization)
- ✅ CORS configuration
- ✅ Helmet security headers

## ⚡ Performance Optimization

### Caching Strategy
```
1. User Profiles → Redis (1 hour TTL)
2. Room Metadata → Redis (30 min TTL)
3. Recent Messages → Redis (15 min TTL)
4. User Presence → Redis (5 min TTL)
```

### Database Optimization
- Connection pooling (max 20 connections)
- Query result caching
- Proper indexing on foreign keys
- Pagination for large datasets
- Lazy loading for relations

### WebSocket Optimization
- Connection pooling
- Message batching
- Compression enabled
- Heartbeat mechanism
- Automatic reconnection

## 🔄 Scalability Considerations

### Horizontal Scaling
```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Server  │    │  Server  │    │  Server  │
│    1     │    │    2     │    │    3     │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
              ┌──────▼──────┐
              │    Redis    │
              │   Pub/Sub   │
              └─────────────┘
```

### Load Balancing
- Nginx/HAProxy for HTTP load balancing
- Sticky sessions for WebSocket connections
- Redis Pub/Sub for cross-server communication

### Database Scaling
- Read replicas for read-heavy operations
- Connection pooling
- Query optimization
- Partitioning for large tables (messages)

## 📊 Monitoring & Logging

### Metrics to Track
- Request rate (req/sec)
- Response time (avg, p95, p99)
- Error rate (%)
- Active WebSocket connections
- Database query performance
- Redis hit/miss ratio
- Memory usage
- CPU usage

### Logging Strategy
```
Development: Console + File
Production: Centralized logging (ELK Stack)

Log Levels:
- ERROR: Application errors
- WARN: Warnings and deprecations
- INFO: Important events
- DEBUG: Detailed debugging info
```

## 🚀 Deployment Architecture

### Production Setup
```
┌─────────────────────────────────────────┐
│          Load Balancer (Nginx)          │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  App Server  │  │  App Server   │
│  (Docker)    │  │  (Docker)     │
└───────┬──────┘  └──────┬────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  PostgreSQL  │  │     Redis     │
│  (Primary +  │  │   (Cluster)   │
│   Replica)   │  │               │
└──────────────┘  └───────────────┘
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2026-04-23  
**Status**: Phase 1 Complete