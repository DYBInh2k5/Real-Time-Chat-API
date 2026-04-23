# API Documentation

## Overview
Complete API documentation for the Real-Time Chat API. This document covers all REST endpoints and WebSocket events.

**Base URL:** `http://localhost:3000/api`  
**WebSocket URL:** `ws://localhost:3000/chat`

---

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Messages](#messages)
4. [Conversations](#conversations)
5. [WebSocket Events](#websocket-events)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

### Register
Create a new user account.

**Endpoint:** `POST /api/auth/register`  
**Access:** Public

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "offline",
    "role": "user",
    "isEmailVerified": false,
    "createdAt": "2026-04-23T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- `username`: 3-20 characters, alphanumeric + underscore
- `email`: Valid email format
- `password`: Min 8 characters, 1 uppercase, 1 lowercase, 1 number
- `firstName`, `lastName`: Optional, max 50 characters

---

### Login
Authenticate and get access tokens.

**Endpoint:** `POST /api/auth/login`  
**Access:** Public

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "status": "online"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `404 Not Found`: User not found

---

### Get Current User
Get authenticated user information.

**Endpoint:** `GET /api/auth/me`  
**Access:** Protected (JWT required)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "status": "online",
  "role": "user",
  "isEmailVerified": true,
  "createdAt": "2026-04-23T10:00:00.000Z",
  "updatedAt": "2026-04-23T10:00:00.000Z"
}
```

---

### Refresh Token
Get new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`  
**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Logout
Invalidate refresh token.

**Endpoint:** `POST /api/auth/logout`  
**Access:** Protected

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### Request Password Reset
Request password reset email.

**Endpoint:** `POST /api/auth/forgot-password`  
**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset email sent"
}
```

---

### Reset Password
Reset password using token from email.

**Endpoint:** `POST /api/auth/reset-password`  
**Access:** Public

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewPassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

---

### Verify Email
Verify email address using token.

**Endpoint:** `POST /api/auth/verify-email`  
**Access:** Public

**Request Body:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

---

### Change Password
Change password for authenticated user.

**Endpoint:** `POST /api/auth/change-password`  
**Access:** Protected

**Request Body:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

---

## Users

### Get All Users
Get list of all users with pagination.

**Endpoint:** `GET /api/users`  
**Access:** Protected

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by username or email
- `status` (optional): Filter by status (online, offline, away)

**Example:** `GET /api/users?page=1&limit=20&search=john&status=online`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "online",
      "lastSeen": "2026-04-23T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### Get User by ID
Get specific user information.

**Endpoint:** `GET /api/users/:id`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "status": "online",
  "role": "user",
  "createdAt": "2026-04-23T10:00:00.000Z",
  "lastSeen": "2026-04-23T10:00:00.000Z"
}
```

---

### Update User Profile
Update authenticated user's profile.

**Endpoint:** `PATCH /api/users/me`  
**Access:** Protected

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software Developer",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Software Developer",
  "avatarUrl": "https://example.com/avatar.jpg",
  "updatedAt": "2026-04-23T10:00:00.000Z"
}
```

---

### Update User Status
Update user online status.

**Endpoint:** `PATCH /api/users/me/status`  
**Access:** Protected

**Request Body:**
```json
{
  "status": "away"
}
```

**Valid Status Values:** `online`, `offline`, `away`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "away",
  "lastSeen": "2026-04-23T10:00:00.000Z"
}
```

---

### Delete User Account
Delete authenticated user's account.

**Endpoint:** `DELETE /api/users/me`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

---

## Messages

### Send Message
Send a new message to a conversation.

**Endpoint:** `POST /api/messages`  
**Access:** Protected

**Request Body:**
```json
{
  "conversationId": "uuid",
  "content": "Hello, how are you?",
  "type": "text",
  "replyToId": "uuid (optional)"
}
```

**Message Types:** `text`, `image`, `file`, `audio`, `video`, `system`

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "content": "Hello, how are you?",
  "type": "text",
  "status": "sent",
  "replyTo": null,
  "createdAt": "2026-04-23T10:00:00.000Z",
  "sender": {
    "id": "uuid",
    "username": "johndoe",
    "avatarUrl": null
  }
}
```

---

### Get Conversation Messages
Get messages from a specific conversation.

**Endpoint:** `GET /api/messages/conversation/:conversationId`  
**Access:** Protected

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `before` (optional): Get messages before this message ID
- `after` (optional): Get messages after this message ID

**Example:** `GET /api/messages/conversation/uuid?page=1&limit=50`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "content": "Hello!",
      "type": "text",
      "status": "read",
      "createdAt": "2026-04-23T10:00:00.000Z",
      "sender": {
        "id": "uuid",
        "username": "johndoe",
        "avatarUrl": null
      },
      "replyTo": null
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

---

### Get Message by ID
Get specific message details.

**Endpoint:** `GET /api/messages/:id`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "content": "Hello!",
  "type": "text",
  "status": "read",
  "createdAt": "2026-04-23T10:00:00.000Z",
  "updatedAt": "2026-04-23T10:00:00.000Z",
  "sender": {
    "id": "uuid",
    "username": "johndoe"
  },
  "replyTo": null
}
```

---

### Update Message
Edit message content (only sender can edit).

**Endpoint:** `PATCH /api/messages/:id`  
**Access:** Protected

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "content": "Updated message content",
  "isEdited": true,
  "updatedAt": "2026-04-23T10:00:00.000Z"
}
```

---

### Delete Message
Soft delete a message.

**Endpoint:** `DELETE /api/messages/:id`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "message": "Message deleted successfully"
}
```

---

### Mark Message as Read
Mark a message as read.

**Endpoint:** `PATCH /api/messages/:id/read`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "read",
  "readAt": "2026-04-23T10:00:00.000Z"
}
```

---

### Mark All Messages as Read
Mark all messages in a conversation as read.

**Endpoint:** `PATCH /api/messages/conversation/:conversationId/read-all`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "message": "All messages marked as read",
  "count": 15
}
```

---

### Search Messages
Search messages in conversations.

**Endpoint:** `GET /api/messages/search`  
**Access:** Protected

**Query Parameters:**
- `query` (required): Search query
- `conversationId` (optional): Limit search to specific conversation
- `page` (optional): Page number
- `limit` (optional): Items per page

**Example:** `GET /api/messages/search?query=hello&conversationId=uuid`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Hello, how are you?",
      "conversationId": "uuid",
      "createdAt": "2026-04-23T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

---

## Conversations

### Create Conversation
Create a new conversation (direct, group, or channel).

**Endpoint:** `POST /api/conversations`  
**Access:** Protected

**Request Body:**
```json
{
  "type": "group",
  "name": "Project Team",
  "description": "Team discussion",
  "memberIds": ["uuid1", "uuid2", "uuid3"],
  "isPrivate": false
}
```

**Conversation Types:** `direct`, `group`, `channel`

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "type": "group",
  "name": "Project Team",
  "description": "Team discussion",
  "isPrivate": false,
  "createdById": "uuid",
  "createdAt": "2026-04-23T10:00:00.000Z",
  "members": [
    {
      "userId": "uuid1",
      "role": "owner",
      "joinedAt": "2026-04-23T10:00:00.000Z"
    }
  ]
}
```

---

### Get User Conversations
Get all conversations for authenticated user.

**Endpoint:** `GET /api/conversations`  
**Access:** Protected

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Filter by type (direct, group, channel)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "group",
      "name": "Project Team",
      "lastMessage": {
        "content": "Hello everyone!",
        "createdAt": "2026-04-23T10:00:00.000Z",
        "sender": {
          "username": "johndoe"
        }
      },
      "unreadCount": 3,
      "updatedAt": "2026-04-23T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

---

### Get Conversation by ID
Get specific conversation details.

**Endpoint:** `GET /api/conversations/:id`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "type": "group",
  "name": "Project Team",
  "description": "Team discussion",
  "isPrivate": false,
  "createdById": "uuid",
  "createdAt": "2026-04-23T10:00:00.000Z",
  "members": [
    {
      "userId": "uuid",
      "role": "owner",
      "user": {
        "id": "uuid",
        "username": "johndoe",
        "status": "online"
      }
    }
  ]
}
```

---

### Update Conversation
Update conversation details (owner/admin only).

**Endpoint:** `PATCH /api/conversations/:id`  
**Access:** Protected

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "isPrivate": true
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Updated Team Name",
  "description": "Updated description",
  "isPrivate": true,
  "updatedAt": "2026-04-23T10:00:00.000Z"
}
```

---

### Delete Conversation
Delete a conversation (owner only).

**Endpoint:** `DELETE /api/conversations/:id`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "message": "Conversation deleted successfully"
}
```

---

### Add Member
Add member to conversation (owner/admin only).

**Endpoint:** `POST /api/conversations/:id/members`  
**Access:** Protected

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "member"
}
```

**Member Roles:** `owner`, `admin`, `moderator`, `member`

**Response:** `201 Created`
```json
{
  "userId": "uuid",
  "conversationId": "uuid",
  "role": "member",
  "joinedAt": "2026-04-23T10:00:00.000Z"
}
```

---

### Remove Member
Remove member from conversation (owner/admin only).

**Endpoint:** `DELETE /api/conversations/:id/members/:userId`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "message": "Member removed successfully"
}
```

---

### Update Member Role
Update member's role (owner/admin only).

**Endpoint:** `PATCH /api/conversations/:id/members/:userId/role`  
**Access:** Protected

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:** `200 OK`
```json
{
  "userId": "uuid",
  "role": "admin",
  "updatedAt": "2026-04-23T10:00:00.000Z"
}
```

---

### Leave Conversation
Leave a conversation.

**Endpoint:** `POST /api/conversations/:id/leave`  
**Access:** Protected

**Response:** `200 OK`
```json
{
  "message": "Left conversation successfully"
}
```

---

## WebSocket Events

### Connection

**Connect to WebSocket:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

---

### Client Events (Emit)

#### 1. Send Message
```javascript
socket.emit('message:send', {
  conversationId: 'uuid',
  content: 'Hello!',
  type: 'text',
  replyToId: 'uuid (optional)'
});
```

#### 2. Start Typing
```javascript
socket.emit('typing:start', {
  conversationId: 'uuid'
});
```

#### 3. Stop Typing
```javascript
socket.emit('typing:stop', {
  conversationId: 'uuid'
});
```

#### 4. Mark as Read
```javascript
socket.emit('message:read', {
  messageId: 'uuid'
});
```

#### 5. Join Conversation
```javascript
socket.emit('conversation:join', {
  conversationId: 'uuid'
});
```

#### 6. Leave Conversation
```javascript
socket.emit('conversation:leave', {
  conversationId: 'uuid'
});
```

---

### Server Events (Listen)

#### 1. Message Sent (Confirmation)
```javascript
socket.on('message:sent', (data) => {
  console.log('Message sent:', data);
  // { id, conversationId, content, createdAt }
});
```

#### 2. Message Received
```javascript
socket.on('message:received', (message) => {
  console.log('New message:', message);
  // { id, conversationId, senderId, content, type, createdAt, sender }
});
```

#### 3. Message Updated
```javascript
socket.on('message:updated', (message) => {
  console.log('Message updated:', message);
  // { id, content, isEdited, updatedAt }
});
```

#### 4. Message Deleted
```javascript
socket.on('message:deleted', (data) => {
  console.log('Message deleted:', data);
  // { messageId, conversationId }
});
```

#### 5. Typing Status
```javascript
socket.on('typing:status', (data) => {
  console.log('User typing:', data);
  // { userId, username, conversationId, isTyping }
});
```

#### 6. User Online
```javascript
socket.on('user:online', (data) => {
  console.log('User online:', data);
  // { userId, username, status: 'online' }
});
```

#### 7. User Offline
```javascript
socket.on('user:offline', (data) => {
  console.log('User offline:', data);
  // { userId, username, status: 'offline', lastSeen }
});
```

#### 8. Message Read
```javascript
socket.on('message:read', (data) => {
  console.log('Message read:', data);
  // { messageId, readBy, readAt }
});
```

#### 9. Error
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // { message, code }
});
```

---

## Error Handling

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

### Default Limits
- **Authentication endpoints:** 5 requests per minute
- **General API:** 100 requests per minute
- **WebSocket connections:** 10 connections per user

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1619712000
```

### Rate Limit Exceeded Response
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Response Format
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Authentication

### JWT Token Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

### Refresh Token Flow
1. Access token expires
2. Client sends refresh token to `/api/auth/refresh`
3. Server returns new access token and refresh token
4. Client updates tokens

---

## Best Practices

### 1. Always Use HTTPS in Production
```
https://api.yourdomain.com/api/...
```

### 2. Handle Token Expiration
```javascript
// Intercept 401 responses and refresh token
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      // Refresh token logic
    }
    return Promise.reject(error);
  }
);
```

### 3. Implement Retry Logic
```javascript
// Retry failed requests
const maxRetries = 3;
let retries = 0;

while (retries < maxRetries) {
  try {
    const response = await api.request();
    return response;
  } catch (error) {
    retries++;
    if (retries === maxRetries) throw error;
    await sleep(1000 * retries);
  }
}
```

### 4. Use WebSocket Reconnection
```javascript
socket.on('disconnect', () => {
  // Implement exponential backoff
  setTimeout(() => socket.connect(), 1000);
});
```

---

## Postman Collection

Import this collection to test all endpoints:

**Collection URL:** [Download Postman Collection](./postman_collection.json)

**Environment Variables:**
- `base_url`: http://localhost:3000
- `access_token`: (auto-updated after login)
- `refresh_token`: (auto-updated after login)

---

## Swagger/OpenAPI

Access interactive API documentation:

**URL:** `http://localhost:3000/api/docs`

Features:
- Try out endpoints directly
- View request/response schemas
- Authentication support
- Example requests

---

## Conclusion

This API documentation provides comprehensive information about all available endpoints and WebSocket events. For additional support or questions, please refer to the project README or contact the development team.

**Last Updated:** 2026-04-23  
**API Version:** 1.0.0