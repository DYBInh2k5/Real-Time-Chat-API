# 🚀 Real-Time Chat API

A production-ready RESTful API and WebSocket server for real-time chat applications built with NestJS, TypeScript, PostgreSQL, Redis, and Socket.io.

## ✨ Features

### Core Features
- 🔐 **Authentication & Authorization** - JWT-based auth with refresh tokens
- 💬 **Real-time Messaging** - WebSocket communication via Socket.io
- 👥 **User Management** - Profile management, avatar upload, user search
- 🏠 **Channels & Rooms** - Public/private channels, direct messages, group chats
- 📝 **Message Features** - Edit, delete, reply, reactions, typing indicators
- 📎 **File Sharing** - Image and file uploads with size limits
- 🔍 **Search** - Full-text search for messages and users
- 🔔 **Notifications** - Real-time notifications and email alerts
- 👀 **Presence System** - Online/offline/away status tracking
- ✅ **Read Receipts** - Message read status tracking

### Technical Features
- 🏗️ **Clean Architecture** - Modular structure with separation of concerns
- 🔒 **Security** - Rate limiting, input validation, XSS protection
- 📊 **Database** - PostgreSQL with TypeORM
- ⚡ **Caching** - Redis for sessions, presence, and pub/sub
- 📚 **API Documentation** - Swagger/OpenAPI integration
- 🧪 **Testing** - Unit, integration, and E2E tests
- 🐳 **Docker** - Containerized development and deployment
- 🔄 **CI/CD Ready** - GitHub Actions workflow included

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15
- **Cache/Pub-Sub**: Redis 7
- **Real-time**: Socket.io
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker** & **Docker Compose** (for running databases)
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd realtime-chat-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=realtime_chat

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRATION=7d
```

### 4. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d postgres redis
```

Verify services are running:

```bash
docker-compose ps
```

### 5. Run the Application

#### Development Mode (with hot-reload)

```bash
npm run start:dev
```

#### Production Mode

```bash
npm run build
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs

## 📁 Project Structure

```
realtime-chat-api/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User management
│   │   ├── chat/            # Chat & messaging
│   │   ├── rooms/           # Rooms/channels
│   │   └── files/           # File upload
│   ├── common/              # Shared utilities
│   │   ├── decorators/      # Custom decorators
│   │   ├── filters/         # Exception filters
│   │   ├── guards/          # Auth guards
│   │   ├── interceptors/    # Interceptors
│   │   └── pipes/           # Validation pipes
│   ├── config/              # Configuration files
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── jwt.config.ts
│   ├── database/            # Database entities & migrations
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
├── test/                    # Test files
├── docker-compose.yml       # Docker services
├── Dockerfile              # Production container
└── .env                    # Environment variables
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
POST   /api/auth/logout        - Logout user
POST   /api/auth/refresh       - Refresh access token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Users
```
GET    /api/users/me           - Get current user
PUT    /api/users/me           - Update profile
GET    /api/users/:id          - Get user by ID
GET    /api/users/search       - Search users
PUT    /api/users/avatar       - Upload avatar
```

### Chat & Messaging
```
POST   /api/messages           - Send message
GET    /api/messages/:id       - Get message
PUT    /api/messages/:id       - Edit message
DELETE /api/messages/:id       - Delete message
POST   /api/messages/:id/react - React to message
```

### Rooms/Channels
```
POST   /api/rooms              - Create room
GET    /api/rooms              - List rooms
GET    /api/rooms/:id          - Get room details
PUT    /api/rooms/:id          - Update room
DELETE /api/rooms/:id          - Delete room
POST   /api/rooms/:id/join     - Join room
POST   /api/rooms/:id/leave    - Leave room
```

## 🔌 WebSocket Events

### Client → Server
```typescript
socket.emit('join_room', { roomId })
socket.emit('leave_room', { roomId })
socket.emit('send_message', { roomId, content, type })
socket.emit('typing_start', { roomId })
socket.emit('typing_stop', { roomId })
socket.emit('mark_read', { messageId })
```

### Server → Client
```typescript
socket.on('message_received', { message })
socket.on('user_joined', { user, roomId })
socket.on('user_left', { userId, roomId })
socket.on('user_typing', { userId, roomId })
socket.on('message_read', { messageId, userId })
socket.on('presence_update', { userId, status })
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Unit Tests
```bash
npm run test:unit
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t realtime-chat-api .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- NestJS application

## 📊 Database Migrations

### Generate Migration
```bash
npm run migration:generate -- -n MigrationName
```

### Run Migrations
```bash
npm run migration:run
```

### Revert Migration
```bash
npm run migration:revert
```

## 🔒 Security Best Practices

- ✅ JWT tokens with short expiration
- ✅ Refresh token rotation
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Helmet for security headers
- ✅ SQL injection prevention via ORM

## 📈 Performance Optimization

- ⚡ Redis caching for frequently accessed data
- ⚡ Database query optimization with indexes
- ⚡ Connection pooling
- ⚡ Compression middleware
- ⚡ Pagination for large datasets
- ⚡ WebSocket connection management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Roadmap

### Phase 1: Core Setup ✅
- [x] Project initialization
- [x] Database configuration
- [x] Authentication system
- [x] Basic API structure

### Phase 2: Real-time Features (In Progress)
- [ ] WebSocket server setup
- [ ] Real-time messaging
- [ ] Presence system
- [ ] Typing indicators

### Phase 3: Advanced Features
- [ ] File upload & sharing
- [ ] Message search
- [ ] Notifications
- [ ] Message reactions

### Phase 4: Optimization
- [ ] Caching strategy
- [ ] Rate limiting
- [ ] Performance tuning
- [ ] Load testing

### Phase 5: Production Ready
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] CI/CD pipeline
- [ ] Monitoring & logging

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Socket.io for real-time capabilities
- TypeORM for database management
- All contributors and supporters

---

**Happy Coding! 🚀**
