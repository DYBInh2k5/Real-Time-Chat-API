# 🚀 Real-Time Chat API

A production-ready, scalable RESTful API and WebSocket server for real-time chat applications built with NestJS, TypeScript, PostgreSQL, Redis, and Socket.io.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Performance](#-performance)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt (10 rounds)
- Email verification system
- Password reset functionality
- Role-based access control (User, Admin, Moderator)
- Session management with Redis

### 💬 Real-time Messaging
- WebSocket communication via Socket.io
- Direct messages (1-on-1)
- Group conversations
- Public/private channels
- Message types: text, image, file, audio, video, system
- Message status tracking (sent, delivered, read, failed)
- Reply to messages
- Edit and delete messages
- Soft delete support

### 👥 Conversations Management
- Three conversation types: Direct, Group, Channel
- Role-based permissions (Owner, Admin, Moderator, Member)
- Add/remove members
- Update member roles
- Leave conversations
- Privacy settings (public/private)

### 📝 Advanced Features
- Typing indicators
- Read receipts
- Online presence system (online, offline, away)
- Message reactions (entity ready)
- User blocking (entity ready)
- Full-text message search
- Pagination for all list endpoints

### 🔒 Security Features
- Rate limiting on all endpoints
- Input validation with class-validator
- XSS protection
- CORS configuration
- Helmet security headers
- SQL injection prevention via TypeORM
- Environment-based configuration

### 📊 Performance Optimization
- Database indexes on frequently queried fields
- Connection pooling
- Redis caching strategy
- Efficient pagination
- Query optimization
- WebSocket connection management

## 🛠️ Tech Stack

### Backend Framework
- **NestJS** 10.x - Progressive Node.js framework
- **TypeScript** 5.x - Type-safe JavaScript
- **Node.js** 18.x - JavaScript runtime

### Database & Caching
- **PostgreSQL** 15 - Primary database
- **TypeORM** - Object-Relational Mapping
- **Redis** 7 - Caching and pub/sub

### Real-time Communication
- **Socket.io** 4.x - WebSocket library
- **@nestjs/websockets** - NestJS WebSocket module

### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens
- **bcrypt** - Password hashing
- **class-validator** - Input validation
- **class-transformer** - Object transformation

### Documentation & Testing
- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing framework
- **Supertest** - HTTP assertions

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **npm** >= 9.x (comes with Node.js)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

Optional but recommended:
- **PostgreSQL** 15 (if not using Docker)
- **Redis** 7 (if not using Docker)
- **Postman** or **Insomnia** (for API testing)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/DYBInh2k5/Real-Time-Chat-API.git
cd realtime-chat-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

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
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads
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

### 5. Run Database Migrations

```bash
# Generate migration (if needed)
npm run migration:generate -- -n InitialSchema

# Run migrations
npm run migration:run

# Verify migrations
npm run migration:show
```

### 6. Run the Application

#### Development Mode (with hot-reload)

```bash
npm run start:dev
```

#### Production Mode

```bash
npm run build
npm run start:prod
```

#### Watch Mode

```bash
npm run start:debug
```

### 7. Access the Application

- **API Base URL**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/api/docs
- **WebSocket**: ws://localhost:3000/chat
- **Health Check**: http://localhost:3000/health

## 📁 Project Structure

```
realtime-chat-api/
├── src/
│   ├── modules/                    # Feature modules
│   │   ├── auth/                  # Authentication module
│   │   │   ├── dto/               # Data Transfer Objects
│   │   │   ├── guards/            # Auth guards
│   │   │   ├── strategies/        # Passport strategies
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/                 # User management
│   │   │   ├── entities/          # User entity
│   │   │   ├── dto/               # DTOs
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── messages/              # Message management
│   │   │   ├── entities/          # Message entity
│   │   │   ├── dto/               # DTOs
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   └── messages.module.ts
│   │   ├── conversations/         # Conversation management
│   │   │   ├── entities/          # Conversation entities
│   │   │   ├── dto/               # DTOs
│   │   │   ├── conversations.controller.ts
│   │   │   ├── conversations.service.ts
│   │   │   └── conversations.module.ts
│   │   └── chat/                  # WebSocket gateway
│   │       ├── chat.gateway.ts
│   │       └── chat.module.ts
│   ├── common/                    # Shared utilities
│   │   ├── decorators/            # Custom decorators
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/                # Guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/          # Interceptors
│   │   ├── filters/               # Exception filters
│   │   ├── pipes/                 # Validation pipes
│   │   └── cache/                 # Cache service
│   ├── config/                    # Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── redis.config.ts
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller
│   └── main.ts                    # Application entry point
├── test/                          # Test files
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── e2e/                       # End-to-end tests
├── docs/                          # Documentation
│   ├── API_DOCUMENTATION.md       # Complete API docs
│   ├── TESTING_GUIDE.md           # Testing guide
│   ├── DEPLOYMENT_GUIDE.md        # Deployment guide
│   ├── PERFORMANCE_GUIDE.md       # Performance optimization
│   └── PHASE*_SUMMARY.md          # Phase summaries
├── docker-compose.yml             # Docker services
├── Dockerfile                     # Production container
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── nest-cli.json                  # NestJS CLI config
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies
```

## 📚 API Documentation

### Quick Reference

#### Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
GET    /api/auth/me                - Get current user
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout user
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
POST   /api/auth/verify-email      - Verify email
POST   /api/auth/change-password   - Change password
```

#### User Endpoints
```
GET    /api/users                  - Get all users (paginated)
GET    /api/users/:id              - Get user by ID
PATCH  /api/users/me               - Update profile
PATCH  /api/users/me/status        - Update status
DELETE /api/users/me               - Delete account
GET    /api/users/search           - Search users
```

#### Message Endpoints
```
POST   /api/messages               - Send message
GET    /api/messages/:id           - Get message by ID
GET    /api/messages/conversation/:id - Get conversation messages
PATCH  /api/messages/:id           - Update message
DELETE /api/messages/:id           - Delete message
PATCH  /api/messages/:id/read      - Mark as read
PATCH  /api/messages/conversation/:id/read-all - Mark all as read
GET    /api/messages/search        - Search messages
```

#### Conversation Endpoints
```
POST   /api/conversations          - Create conversation
GET    /api/conversations          - Get user conversations
GET    /api/conversations/:id      - Get conversation by ID
PATCH  /api/conversations/:id      - Update conversation
DELETE /api/conversations/:id      - Delete conversation
POST   /api/conversations/:id/members - Add member
DELETE /api/conversations/:id/members/:userId - Remove member
PATCH  /api/conversations/:id/members/:userId/role - Update role
POST   /api/conversations/:id/leave - Leave conversation
```

### Complete Documentation

For detailed API documentation with request/response examples, see:
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **Swagger UI**: http://localhost:3000/api/docs (when running)

## 🔌 WebSocket Events

### Client → Server Events

```typescript
// Connect to WebSocket
const socket = io('http://localhost:3000/chat', {
  auth: { token: 'your_jwt_token' }
});

// Send message
socket.emit('message:send', {
  conversationId: 'uuid',
  content: 'Hello!',
  type: 'text'
});

// Typing indicators
socket.emit('typing:start', { conversationId: 'uuid' });
socket.emit('typing:stop', { conversationId: 'uuid' });

// Mark as read
socket.emit('message:read', { messageId: 'uuid' });

// Join/leave conversation
socket.emit('conversation:join', { conversationId: 'uuid' });
socket.emit('conversation:leave', { conversationId: 'uuid' });
```

### Server → Client Events

```typescript
// Message events
socket.on('message:sent', (data) => {});      // Confirmation
socket.on('message:received', (message) => {}); // New message
socket.on('message:updated', (message) => {});  // Message edited
socket.on('message:deleted', (data) => {});     // Message deleted

// Typing events
socket.on('typing:status', (data) => {});       // User typing

// Presence events
socket.on('user:online', (data) => {});         // User online
socket.on('user:offline', (data) => {});        // User offline

// Read receipts
socket.on('message:read', (data) => {});        // Message read

// Errors
socket.on('error', (error) => {});              // Error occurred
```

## 🗄️ Database Schema

### Core Entities

#### User
- `id` (UUID, PK)
- `username` (unique)
- `email` (unique)
- `password` (hashed)
- `firstName`, `lastName`
- `status` (online/offline/away)
- `role` (user/admin/moderator)
- `isEmailVerified`
- `emailVerificationToken`
- `passwordResetToken`
- `passwordResetExpires`
- `lastSeen`
- `createdAt`, `updatedAt`

#### Message
- `id` (UUID, PK)
- `conversationId` (FK)
- `senderId` (FK)
- `content`
- `type` (text/image/file/audio/video/system)
- `status` (sent/delivered/read/failed)
- `replyToId` (FK, self-reference)
- `isEdited`
- `deletedAt` (soft delete)
- `createdAt`, `updatedAt`

#### Conversation
- `id` (UUID, PK)
- `type` (direct/group/channel)
- `name`
- `description`
- `isPrivate`
- `createdById` (FK)
- `lastMessageAt`
- `createdAt`, `updatedAt`

#### ConversationMember
- `id` (UUID, PK)
- `conversationId` (FK)
- `userId` (FK)
- `role` (owner/admin/moderator/member)
- `joinedAt`
- `lastReadAt`

#### MessageReaction (Entity ready)
- `id` (UUID, PK)
- `messageId` (FK)
- `userId` (FK)
- `emoji`
- `createdAt`

#### UserBlock (Entity ready)
- `id` (UUID, PK)
- `blockerId` (FK)
- `blockedId` (FK)
- `createdAt`

### Database Indexes

Optimized indexes for performance:
- Users: `username`, `email`, `status`
- Messages: `conversationId`, `senderId`, `createdAt`, `status`
- Conversations: `type`, `createdById`, `lastMessageAt`
- ConversationMembers: `conversationId`, `userId`, `role`

## 🧪 Testing

### Test Structure

```
test/
├── unit/              # Unit tests for services, controllers
├── integration/       # Integration tests for modules
└── e2e/              # End-to-end tests for complete flows
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- users.service.spec.ts
```

### Test Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Testing Guide

For comprehensive testing examples and best practices, see:
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete testing guide

## 🚀 Deployment

### Docker Deployment

#### Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

#### Production Dockerfile

```bash
# Build production image
docker build -t realtime-chat-api:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name chat-api \
  realtime-chat-api:latest
```

### Cloud Deployment

#### Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

#### AWS ECS/Fargate
- Build and push Docker image to ECR
- Create ECS task definition
- Deploy to Fargate cluster
- Configure RDS PostgreSQL and ElastiCache Redis

#### DigitalOcean App Platform
- Connect GitHub repository
- Configure build and run commands
- Add PostgreSQL and Redis databases
- Deploy automatically on push

### Deployment Guide

For detailed deployment instructions, see:
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment guide

## ⚡ Performance

### Optimization Strategies

1. **Database Optimization**
   - Indexes on frequently queried fields
   - Connection pooling (max: 20, min: 5)
   - Query optimization with TypeORM query builder
   - Pagination for large datasets

2. **Caching Strategy**
   - Redis for session storage
   - Cache frequently accessed data
   - TTL-based cache invalidation
   - Pub/sub for real-time updates

3. **API Optimization**
   - Rate limiting (100 req/min)
   - Compression middleware
   - Response pagination
   - Efficient serialization

4. **WebSocket Optimization**
   - Connection pooling
   - Room-based broadcasting
   - Efficient event handling
   - Heartbeat mechanism

### Performance Guide

For detailed performance optimization strategies, see:
- **[PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md)** - Complete performance guide

## 🔒 Security

### Security Features

- ✅ **Authentication**: JWT with short-lived access tokens (15min)
- ✅ **Authorization**: Role-based access control (RBAC)
- ✅ **Password Security**: bcrypt hashing with 10 rounds
- ✅ **Token Rotation**: Refresh token rotation on use
- ✅ **Rate Limiting**: Prevent brute force attacks
- ✅ **Input Validation**: class-validator for all inputs
- ✅ **XSS Protection**: Sanitization and escaping
- ✅ **CORS**: Configured for specific origins
- ✅ **Helmet**: Security headers
- ✅ **SQL Injection**: TypeORM parameterized queries

### Security Best Practices

1. **Never commit sensitive data** (.env files)
2. **Use strong JWT secrets** (min 32 characters)
3. **Enable HTTPS** in production
4. **Rotate secrets regularly**
5. **Monitor for suspicious activity**
6. **Keep dependencies updated**
7. **Use environment variables** for configuration
8. **Implement proper error handling**

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Coding Standards

- Follow TypeScript best practices
- Use ESLint and Prettier
- Write unit tests for new features
- Update documentation
- Follow conventional commits

## 📝 Development Roadmap

### ✅ Phase 1: Project Setup & Architecture (Completed)
- [x] NestJS project initialization
- [x] Docker configuration
- [x] Database setup (PostgreSQL, Redis)
- [x] Environment configuration
- [x] Project structure

### ✅ Phase 2: Authentication & User Management (Completed)
- [x] JWT authentication
- [x] User registration and login
- [x] Password reset flow
- [x] Email verification
- [x] User CRUD operations
- [x] Profile management

### ✅ Phase 3: Real-time Messaging Infrastructure (Completed)
- [x] WebSocket gateway setup
- [x] Message entity and service
- [x] Real-time message delivery
- [x] Typing indicators
- [x] Read receipts
- [x] Online presence system

### ✅ Phase 4: Conversations Management (Completed)
- [x] Conversation types (Direct, Group, Channel)
- [x] Role-based permissions
- [x] Member management
- [x] Conversation CRUD operations

### ✅ Phase 5: Advanced Features - Entities (Completed)
- [x] Message reactions entity
- [x] User blocking entity
- [x] Database relationships

### ✅ Phase 6: Performance Optimization (Completed)
- [x] Database indexes
- [x] Caching strategy documentation
- [x] Performance guide
- [x] Query optimization

### ✅ Phase 7: Testing & Documentation (Completed)
- [x] Testing guide
- [x] Deployment guide
- [x] API documentation
- [x] README update

### 🔄 Phase 8: Production Ready (In Progress)
- [ ] Comprehensive test suite
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring and logging
- [ ] Error tracking (Sentry)
- [ ] Load testing
- [ ] Production deployment

### 🔮 Future Enhancements
- [ ] Voice/video calling
- [ ] File upload to cloud storage (S3)
- [ ] Message encryption (E2E)
- [ ] Push notifications (FCM)
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Multi-language support
- [ ] Message threading
- [ ] Polls and surveys
- [ ] Bot integration

## 📊 Project Statistics

- **Total Files**: 83+
- **Lines of Code**: ~6,000+
- **Modules**: 5 (Auth, Users, Messages, Conversations, Chat)
- **Entities**: 6 (User, Message, Conversation, ConversationMember, MessageReaction, UserBlock)
- **API Endpoints**: 43 REST endpoints
- **WebSocket Events**: 12 events
- **Documentation**: 11 comprehensive guides
- **Test Coverage**: Target 80%+

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**DYBInh2k5**
- GitHub: [@DYBInh2k5](https://github.com/DYBInh2k5)
- Repository: [Real-Time-Chat-API](https://github.com/DYBInh2k5/Real-Time-Chat-API)

## 🙏 Acknowledgments

- **NestJS Team** - For the amazing framework
- **Socket.io** - For real-time capabilities
- **TypeORM** - For excellent ORM
- **PostgreSQL** - For robust database
- **Redis** - For caching and pub/sub
- **Open Source Community** - For inspiration and support

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs`

## ⭐ Show Your Support

If you find this project helpful, please give it a ⭐ on GitHub!

---

**Built with ❤️ using NestJS, TypeScript, and Socket.io**

**Happy Coding! 🚀**
