# ⚡ Quick Start - Kiểm Tra Sau Khi Setup

## 🔍 Bước 1: Kiểm Tra Docker Containers

Mở terminal mới và chạy:

```bash
cd realtime-chat-api
docker-compose ps
```

Bạn sẽ thấy output tương tự:

```
NAME                        STATUS              PORTS
realtime-chat-postgres      Up                  0.0.0.0:5432->5432/tcp
realtime-chat-redis         Up                  0.0.0.0:6379->6379/tcp
```

Nếu STATUS là "Up", containers đã chạy thành công! ✅

## 🚀 Bước 2: Khởi Động Application

Trong terminal, chạy:

```bash
npm run start:dev
```

Bạn sẽ thấy output:

```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] AppModule dependencies initialized
[Nest] LOG [RoutesResolver] AppController {/api}:
[Nest] LOG [RouterExplorer] Mapped {/api, GET} route
[Nest] LOG [NestApplication] Nest application successfully started
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation: http://localhost:3000/api/docs
```

## ✅ Bước 3: Kiểm Tra API

### 3.1 Kiểm Tra Health Endpoint

Mở trình duyệt hoặc dùng curl:

```bash
curl http://localhost:3000/api
```

Hoặc mở: http://localhost:3000/api

Bạn sẽ thấy: `"Hello World!"`

### 3.2 Kiểm Tra Swagger Documentation

Mở trình duyệt: http://localhost:3000/api/docs

Bạn sẽ thấy Swagger UI với:
- API title: "Real-time Chat API"
- Version: 1.0
- Các endpoints hiện có

## 🎯 Bước 4: Test Database Connection

Nếu application khởi động thành công mà không có lỗi database connection, nghĩa là:
- ✅ PostgreSQL đang chạy
- ✅ TypeORM đã kết nối thành công
- ✅ Database "realtime_chat" đã được tạo

## 🔴 Bước 5: Test Redis Connection

Redis connection sẽ được test khi chúng ta implement caching trong Phase 2.

## 🐛 Xử Lý Lỗi

### Lỗi: "Cannot connect to database"

**Kiểm tra:**
```bash
docker-compose ps
```

**Nếu postgres không chạy:**
```bash
docker-compose up -d postgres
docker-compose logs postgres
```

### Lỗi: "Port 3000 already in use"

**Giải pháp 1:** Dừng process đang dùng port 3000

**Giải pháp 2:** Đổi port trong `.env`:
```env
PORT=3001
```

### Lỗi: "Redis connection failed"

**Kiểm tra:**
```bash
docker-compose ps redis
docker-compose logs redis
```

**Restart Redis:**
```bash
docker-compose restart redis
```

## 📊 Các Lệnh Hữu Ích

### Docker Commands

```bash
# Xem tất cả containers
docker-compose ps

# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart service
docker-compose restart postgres
docker-compose restart redis

# Stop tất cả services
docker-compose down

# Start lại tất cả services
docker-compose up -d
```

### Application Commands

```bash
# Development mode (hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Watch mode
npm run start:debug
```

### Database Commands

```bash
# Kết nối PostgreSQL
docker exec -it realtime-chat-postgres psql -U postgres -d realtime_chat

# Trong PostgreSQL shell:
\dt              # List tables
\d table_name    # Describe table
\q               # Quit
```

### Redis Commands

```bash
# Kết nối Redis
docker exec -it realtime-chat-redis redis-cli

# Trong Redis shell:
PING             # Test connection
KEYS *           # List all keys
GET key_name     # Get value
exit             # Quit
```

## ✅ Checklist Hoàn Thành Phase 1

- [ ] Docker containers đang chạy (postgres, redis)
- [ ] Application khởi động thành công
- [ ] Truy cập được http://localhost:3000/api
- [ ] Swagger docs hiển thị tại http://localhost:3000/api/docs
- [ ] Không có lỗi trong console
- [ ] Code đã được push lên GitHub

## 🎉 Nếu Tất Cả Đều OK

**Chúc mừng!** Phase 1 đã hoàn thành thành công! 🚀

Bạn đã có:
- ✅ NestJS application chạy được
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Swagger documentation
- ✅ Docker containerization
- ✅ GitHub repository

## 🚀 Tiếp Theo: Phase 2

Khi sẵn sàng, chúng ta sẽ bắt đầu Phase 2:

**Phase 2: Authentication & User Management**
- Create User entity
- Implement JWT authentication
- Register/Login endpoints
- Password hashing
- User profile management

**Thời gian ước tính:** 3-4 ngày

---

**Cần trợ giúp?** Kiểm tra lại:
1. SETUP_GUIDE.md - Hướng dẫn setup chi tiết
2. README.md - Documentation đầy đủ
3. ARCHITECTURE.md - Kiến trúc hệ thống
4. Docker logs: `docker-compose logs -f`

**Happy Coding! 🎉**