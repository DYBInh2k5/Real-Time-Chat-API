# 🚀 Quick Setup Guide - Real-Time Chat API

Hướng dẫn setup nhanh dự án Real-Time Chat API trong 10 phút!

## 📋 Yêu Cầu Hệ Thống

- ✅ Node.js >= 18.x (Đã có: v22.20.0)
- ✅ npm >= 9.x (Đã có: 10.9.3)
- ⚠️ Docker Desktop (Cần cài đặt)

## 🔧 Bước 1: Cài Đặt Docker (Nếu Chưa Có)

### Windows:
1. Tải Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Cài đặt và khởi động Docker Desktop
3. Kiểm tra: `docker --version`

### Hoặc Sử Dụng PostgreSQL & Redis Local:
Nếu không muốn dùng Docker, bạn có thể cài PostgreSQL và Redis trực tiếp trên máy.

## 🚀 Bước 2: Khởi Động Database

### Với Docker (Khuyến nghị):
```bash
cd realtime-chat-api
docker-compose up -d postgres redis
```

### Kiểm tra services đang chạy:
```bash
docker-compose ps
```

Bạn sẽ thấy:
```
NAME                        STATUS
realtime-chat-postgres      Up
realtime-chat-redis         Up
```

## 🎯 Bước 3: Chạy Ứng Dụng

### Development Mode (Hot Reload):
```bash
npm run start:dev
```

### Hoặc Production Mode:
```bash
npm run build
npm run start:prod
```

## ✅ Bước 4: Kiểm Tra

Mở trình duyệt và truy cập:

1. **API Health Check**: http://localhost:3000/api
2. **Swagger Documentation**: http://localhost:3000/api/docs

Nếu thấy Swagger UI, bạn đã setup thành công! 🎉

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi 1: "Cannot connect to database"
**Nguyên nhân**: PostgreSQL chưa chạy hoặc cấu hình sai

**Giải pháp**:
```bash
# Kiểm tra Docker containers
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Xem logs
docker-compose logs postgres
```

### Lỗi 2: "Redis connection failed"
**Nguyên nhân**: Redis chưa chạy

**Giải pháp**:
```bash
# Restart Redis
docker-compose restart redis

# Xem logs
docker-compose logs redis
```

### Lỗi 3: Port 3000 đã được sử dụng
**Giải pháp**: Thay đổi port trong file `.env`
```env
PORT=3001
```

### Lỗi 4: TypeScript compilation errors
**Giải pháp**:
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Hoặc trên Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

## 📊 Kiểm Tra Database

### Kết nối PostgreSQL:
```bash
docker exec -it realtime-chat-postgres psql -U postgres -d realtime_chat
```

### Các lệnh PostgreSQL hữu ích:
```sql
-- Xem tất cả tables
\dt

-- Xem cấu trúc table
\d table_name

-- Thoát
\q
```

### Kết nối Redis:
```bash
docker exec -it realtime-chat-redis redis-cli
```

### Các lệnh Redis hữu ích:
```bash
# Ping Redis
PING

# Xem tất cả keys
KEYS *

# Thoát
exit
```

## 🎓 Các Lệnh Hữu Ích

### Development:
```bash
# Chạy với hot reload
npm run start:dev

# Xem logs chi tiết
npm run start:dev -- --debug

# Format code
npm run format

# Lint code
npm run lint
```

### Docker:
```bash
# Khởi động tất cả services
docker-compose up -d

# Dừng tất cả services
docker-compose down

# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f postgres

# Restart service
docker-compose restart postgres

# Xóa volumes (reset database)
docker-compose down -v
```

### Database:
```bash
# Tạo migration
npm run migration:generate -- -n CreateUsersTable

# Chạy migrations
npm run migration:run

# Rollback migration
npm run migration:revert
```

## 📝 Cấu Trúc Dự Án Hiện Tại

```
realtime-chat-api/
├── src/
│   ├── config/              ✅ Database, Redis, JWT configs
│   ├── common/              📁 (Sẽ tạo ở Phase tiếp theo)
│   ├── modules/             📁 (Sẽ tạo ở Phase tiếp theo)
│   ├── database/            📁 (Sẽ tạo entities)
│   ├── app.module.ts        ✅ Root module với configs
│   └── main.ts              ✅ Entry point với Swagger
├── .env                     ✅ Environment variables
├── .env.example             ✅ Example env file
├── docker-compose.yml       ✅ Docker services
├── Dockerfile              ✅ Production container
└── README.md               ✅ Full documentation
```

## 🎯 Tiếp Theo: Phase 2

Sau khi setup xong Phase 1, chúng ta sẽ tiếp tục với:

### Phase 2: Authentication & User Management
- Tạo User entity
- Implement JWT authentication
- Register/Login endpoints
- Password hashing với bcrypt
- Refresh token mechanism
- User profile management

**Thời gian ước tính**: 3-4 ngày

## 💡 Tips

1. **Luôn kiểm tra logs** khi có lỗi:
   ```bash
   docker-compose logs -f
   ```

2. **Sử dụng Swagger** để test API:
   - Truy cập: http://localhost:3000/api/docs
   - Click "Try it out" để test endpoints

3. **Git commits thường xuyên**:
   ```bash
   git add .
   git commit -m "Phase 1: Complete project setup"
   ```

4. **Backup .env file** nhưng không commit lên Git (đã có trong .gitignore)

## 🆘 Cần Trợ Giúp?

Nếu gặp vấn đề:
1. Kiểm tra logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Xem lại file `.env` có đúng cấu hình không
4. Đảm bảo port 3000, 5432, 6379 không bị chiếm dụng

## ✅ Checklist Phase 1

- [x] Node.js và npm đã cài đặt
- [x] Project đã được tạo
- [x] Dependencies đã được cài
- [x] Docker compose file đã tạo
- [x] Environment variables đã config
- [x] Database config đã setup
- [ ] Docker Desktop đã cài và chạy
- [ ] PostgreSQL container đang chạy
- [ ] Redis container đang chạy
- [ ] Application chạy thành công
- [ ] Swagger docs có thể truy cập

---

**Chúc bạn setup thành công! 🚀**

Sau khi hoàn thành Phase 1, hãy cho tôi biết để chúng ta tiếp tục Phase 2: Authentication & User Management!