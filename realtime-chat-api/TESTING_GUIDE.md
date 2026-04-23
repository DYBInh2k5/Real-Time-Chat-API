# Testing Guide

## Overview
This guide provides comprehensive testing strategies and examples for the Real-Time Chat API.

## Testing Stack

### Recommended Tools
- **Jest** - Unit and integration testing (already included with NestJS)
- **Supertest** - HTTP assertions (already included)
- **Socket.io-client** - WebSocket testing
- **@faker-js/faker** - Test data generation
- **@nestjs/testing** - NestJS testing utilities

### Install Additional Dependencies
```bash
npm install --save-dev @faker-js/faker socket.io-client
```

## Test Structure

```
test/
├── unit/                    # Unit tests
│   ├── services/
│   ├── controllers/
│   └── guards/
├── integration/             # Integration tests
│   ├── auth/
│   ├── messages/
│   └── conversations/
├── e2e/                     # End-to-end tests
│   ├── auth.e2e-spec.ts
│   ├── messages.e2e-spec.ts
│   └── chat.e2e-spec.ts
└── fixtures/                # Test data
    ├── users.fixture.ts
    └── messages.fixture.ts
```

## Unit Testing

### Testing Services

**Example: UsersService Test**
```typescript
// test/unit/services/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../../../src/modules/users/users.service';
import { User } from '../../../src/modules/users/entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = { id: '1', username: 'testuser', email: 'test@example.com' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');
      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow('User with ID 999 not found');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };
      const savedUser = { id: '1', ...createUserDto };

      mockRepository.create.mockReturnValue(savedUser);
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);
      expect(result).toEqual(savedUser);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
```

### Testing Controllers

**Example: AuthController Test**
```typescript
// test/unit/controllers/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const result = { user: { id: '1', ...registerDto }, accessToken: 'token' };

      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(registerDto)).toEqual(result);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });
});
```

## Integration Testing

### Testing API Endpoints

**Example: Auth Integration Test**
```typescript
// test/integration/auth/auth.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user.username).toBe('testuser');
        });
    });

    it('should fail with duplicate username', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'another@example.com',
          password: 'Password123!',
        })
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe('testuser');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
```

## E2E Testing

### Testing Complete Workflows

**Example: Message Flow E2E Test**
```typescript
// test/e2e/messages.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Messages E2E Tests', () => {
  let app: INestApplication;
  let user1Token: string;
  let user2Token: string;
  let conversationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login two users
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: 'user1',
        email: 'user1@example.com',
        password: 'Password123!',
      });

    const login1 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'user1', password: 'Password123!' });
    user1Token = login1.body.accessToken;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: 'user2',
        email: 'user2@example.com',
        password: 'Password123!',
      });

    const login2 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'user2', password: 'Password123!' });
    user2Token = login2.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a conversation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/conversations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        type: 'direct',
        memberIds: [/* user2 id */],
      })
      .expect(201);

    conversationId = response.body.id;
    expect(response.body.type).toBe('direct');
  });

  it('should send a message', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/messages')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        content: 'Hello, User 2!',
        conversationId: conversationId,
        type: 'text',
      })
      .expect(201);

    expect(response.body.content).toBe('Hello, User 2!');
    expect(response.body.status).toBe('sent');
  });

  it('should get conversation messages', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/messages/conversation/${conversationId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].content).toBe('Hello, User 2!');
  });
});
```

## WebSocket Testing

### Testing Real-time Features

**Example: Chat Gateway Test**
```typescript
// test/e2e/chat.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../../src/app.module';

describe('Chat Gateway E2E Tests', () => {
  let app: INestApplication;
  let client1: Socket;
  let client2: Socket;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3001);

    // Get tokens for two users
    // ... (register and login logic)
  });

  afterAll(async () => {
    client1?.disconnect();
    client2?.disconnect();
    await app.close();
  });

  it('should connect to WebSocket with valid token', (done) => {
    client1 = io('http://localhost:3001/chat', {
      auth: { token: token1 },
    });

    client1.on('connect', () => {
      expect(client1.connected).toBe(true);
      done();
    });
  });

  it('should receive message in real-time', (done) => {
    client2 = io('http://localhost:3001/chat', {
      auth: { token: token2 },
    });

    client2.on('message:received', (message) => {
      expect(message.content).toBe('Test message');
      done();
    });

    client1.emit('message:send', {
      content: 'Test message',
      receiverId: /* user2 id */,
      type: 'text',
    });
  });

  it('should receive typing indicator', (done) => {
    client2.on('typing:status', (data) => {
      expect(data.isTyping).toBe(true);
      done();
    });

    client1.emit('typing:start', {
      receiverId: /* user2 id */,
      isTyping: true,
    });
  });
});
```

## Test Data Fixtures

### Creating Test Data

**Example: User Fixtures**
```typescript
// test/fixtures/users.fixture.ts
import { faker } from '@faker-js/faker';

export const createUserFixture = (overrides = {}) => ({
  username: faker.internet.userName(),
  email: faker.internet.email(),
  password: 'Password123!',
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  ...overrides,
});

export const createUsersFixture = (count: number) => {
  return Array.from({ length: count }, () => createUserFixture());
};
```

## Running Tests

### Test Commands

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- users.service.spec.ts
```

### Test Configuration

**package.json scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

## Test Coverage Goals

### Target Coverage
- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

### Priority Areas
1. **Critical paths:** Authentication, message sending
2. **Business logic:** Services and use cases
3. **API endpoints:** Controllers
4. **Error handling:** Exception filters
5. **Guards:** Authentication and authorization

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use beforeEach/afterEach for setup/cleanup
- Don't rely on test execution order

### 2. Mock External Dependencies
- Mock database repositories
- Mock external APIs
- Mock WebSocket connections

### 3. Test Naming
```typescript
describe('UsersService', () => {
  describe('findOne', () => {
    it('should return a user when found', () => {});
    it('should throw NotFoundException when not found', () => {});
  });
});
```

### 4. Arrange-Act-Assert Pattern
```typescript
it('should create a user', async () => {
  // Arrange
  const createUserDto = { username: 'test', email: 'test@example.com' };
  
  // Act
  const result = await service.create(createUserDto);
  
  // Assert
  expect(result).toBeDefined();
  expect(result.username).toBe('test');
});
```

### 5. Test Edge Cases
- Empty inputs
- Invalid data
- Boundary conditions
- Error scenarios
- Race conditions

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:cov
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Conclusion

This testing guide provides a foundation for comprehensive testing of the Real-Time Chat API. Implement tests progressively, starting with critical paths and expanding coverage over time.

**Key Takeaways:**
- Write tests for all services and controllers
- Test both success and error scenarios
- Use fixtures for consistent test data
- Aim for high test coverage
- Integrate tests into CI/CD pipeline

---

**Status:** Testing guide complete
**Next Steps:** Implement tests following this guide